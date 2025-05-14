import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { debug } from "console";

// Extend NextAuth types
debug.toString()
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      name?: string | null;
      username?: string | null; // Add username to session
      email?: string | null; // Keep email optional
      image?: string | null;
      position?: string | null; // Add position
    }
  }

  interface User {
    id: string;
    role: string;
    name?: string;
    username?: string; // Add username to User
    email?: string; // Make email optional
    position?: string; // Add position
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    username?: string; // Add username to JWT
    position?: string; // Add position
  }
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// User verification with Supabase - updated without bcrypt
async function verifyCredentials(username: string, password: string) {
  console.log("----------------------------------------------");
  console.log(`AUTH ATTEMPT: Username="${username}", Password="${password ? '******' : 'empty'}"`);
  
  // HARDCODED TEST USERS
  if (username === "admin" && password === "password") {
    console.log("✅ Demo user authenticated successfully");
    return {
      id: "1",
      name: "Admin User",
      username: "admin", // Add username explicitly
      role: "admin"
      // No email required
    };
  }
  
  try {
    // First, query the staff table to find the user by username
    console.log(`[1/4] Querying staff table for username: ${username}`);
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('user_id, name, position')
      .eq('username', username)
      .single();
    
    if (staffError) {
      console.log(`❌ [1/4] Staff query error: ${staffError.message}`);
      console.log("----------------------------------------------");
      return null;
    }
    
    if (!staffData) {
      console.log("❌ [1/4] Staff not found for username:", username);
      console.log("----------------------------------------------");
      return null;
    }
    
    console.log(`✅ [1/4] Found staff: name=${staffData.name}, user_id=${staffData.user_id}`);
    
    // Then, get the user record using the user_id from staff
    console.log(`[2/4] Querying users table for id: ${staffData.user_id}`);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, password, role')
      .eq('id', staffData.user_id)
      .single();
    
    if (userError) {
      console.log(`❌ [2/4] User query error: ${userError.message}`);
      console.log("----------------------------------------------");
      return null;
    }
    
    if (!userData) {
      console.log(`❌ [2/4] User not found for id: ${staffData.user_id}`);
      console.log("----------------------------------------------");
      return null;
    }
    
    console.log(`✅ [2/4] Found user: id=${userData.id}, role=${userData.role}`);
    console.log(`[3/4] Verifying password...`);
    
    // Check if password exists
    if (!userData.password) {
      console.log(`❌ [3/4] User has no stored password in database`);
      console.log("----------------------------------------------");
      return null;
    }
    
    // DIRECT PASSWORD COMPARISON (without bcrypt)
    console.log(`[3/4] Using direct string comparison for password verification`);
    console.log(`Database password: ${userData.password}`);
    console.log(`Provided password: ${password}`);
    
    // Plain text password comparison
    const isPasswordValid = (password === userData.password);
    
    if (!isPasswordValid) {
      console.log("❌ [3/4] Password verification failed - passwords don't match");
      console.log("----------------------------------------------");
      return null;
    }
    
    console.log(`✅ [3/4] Password verified successfully via direct comparison`);
    console.log(`[4/4] Building user object...`);
    
    // Return combined user data
    const userObject = {
      id: userData.id,
      name: staffData.name,
      username: username, // Include the username explicitly
      role: userData.role,
      position: staffData.position
      // No email field needed
    };
    
    console.log(`✅ [4/4] Authentication successful: ${JSON.stringify(userObject)}`);
    console.log("----------------------------------------------");
    return userObject;
  } catch (error) {
    console.error(`❌ Unexpected error during authentication: ${error}`);
    console.log("----------------------------------------------");
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("NextAuth authorize function called");
        
        if (!credentials?.username || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }
        
        try {
          // Call our credential verification function
          const user = await verifyCredentials(
            credentials.username,
            credentials.password
          );
          
          console.log("Auth result:", user ? "Success" : "Failed");
          return user;
        } catch (error) {
          console.error("Error in authorize function:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        // Transfer all relevant properties from user to token
        token.role = user.role;
        token.id = user.id;
        token.username = user.username; // Add username to token
        token.position = user.position; // Add position to token
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        // Transfer all relevant properties from token to session user
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string; // Add username to session
        session.user.position = token.position as string; // Add position to session
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt"
  },
  debug: process.env.NODE_ENV === "development"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };