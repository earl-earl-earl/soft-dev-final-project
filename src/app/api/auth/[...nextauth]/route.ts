import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { createClient } from "@supabase/supabase-js";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      name?: string | null;
      username?: string | null;
      email?: string | null;
      image?: string | null;
      position?: string | null;
    }
  }

  interface User {
    id: string;
    role: string;
    name?: string;
    username?: string;
    email?: string;
    position?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    username?: string;
    position?: string;
  }
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// User verification with Supabase
async function verifyCredentials(username: string, password: string) {
  try {
    // First, query the staff table to find the user by username
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('user_id, name, position')
      .eq('username', username)
      .single();
    
    if (staffError || !staffData) {
      return null;
    }
    
    // Then, get the user record using the user_id from staff
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, password, role')
      .eq('id', staffData.user_id)
      .single();
    
    if (userError || !userData || !userData.password) {
      return null;
    }
    
    // Plain text password comparison
    const isPasswordValid = (password === userData.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // Return combined user data
    return {
      id: userData.id,
      name: staffData.name,
      username: username,
      role: userData.role,
      position: staffData.position
    };
  } catch {
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
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        
        try {
          // Call our credential verification function
          return await verifyCredentials(
            credentials.username,
            credentials.password
          );
        } catch {
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
        token.username = user.username;
        token.position = user.position;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        // Transfer all relevant properties from token to session user
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.position = token.position as string;
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
  debug: false
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };