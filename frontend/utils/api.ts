import { API_URL } from "../constants/apiurl";

interface SignupData{
    email: string;
    password: string;
}

interface LoginData{
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  message?: string;
  expiresAt: string;
  refreshToken: string;
}

export const signup = async (data: SignupData): Promise<{ message: string; userId: number }> => {
    try {
        console.log('Starting signup request...');
        console.log('API URL:', `${API_URL}/auth/signup`);
        console.log('Request data:', { ...data, password: '***' });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 100000); 

        const response = await fetch(`${API_URL}/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('Response received:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if(!response.ok){
            const errorData = await response.json();
            console.error('Signup failed with status:', response.status, 'Error:', errorData);
            throw new Error(errorData.error || "Signup failed");
        }
        
        const responseData = await response.json();
        console.log('Signup successful:', responseData);
        return responseData;
    } catch (error: unknown) {
        console.error('Signup error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out. Please check if the server is running and accessible.');
        }
        
        if (error instanceof TypeError && error.message.includes('Network request failed')) {
            throw new Error('Could not connect to the server. Please check if the server is running and try again.');
        }
        throw error;
    }
};

export const login = async (data: LoginData): Promise <AuthResponse> => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok){
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.message || "Login failed");
        }
        return response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('Network request failed')) {
            console.error('API Connection Error:', error);
            console.log('Attempted API URL:', `${API_URL}/auth/login`);
            throw new Error('Could not connect to the server. Please check your connection and server status.');
        }
        throw error;
    }
};
