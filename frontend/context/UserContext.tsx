import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { API_URL } from "@/constants/apiurl";

interface UserProfile {
  email: string;
  name?: string;
  profilePicture?: string;
  preferences?: any;
}

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (name?: string, profilePictureUri?: string) => Promise<void>;
  deleteProfilePicture: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  loading: false,
  fetchProfile: async () => {},
  updateProfile: async () => {},
  deleteProfilePicture: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { token, isLoggedIn } = useAuth();

  const fetchProfile = async () => {
    if (!token || !isLoggedIn) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (name?: string, profilePictureUri?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (name !== undefined) {
        formData.append("name", name);
      }
      if (profilePictureUri) {
        const filename = profilePictureUri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("profilePicture", {
          uri: profilePictureUri,
          name: filename,
          type,
        } as any);
      }
      const response = await fetch(`${API_URL}/user/profile`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.user);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProfilePicture = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user/profile-picture`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setProfile((prev: UserProfile | null) => (prev ? { ...prev, profilePicture: undefined } : null));
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isLoggedIn, token]);

  return (
    <UserContext.Provider value={{ profile, loading, fetchProfile, updateProfile, deleteProfilePicture }}>{children}</UserContext.Provider>
  );
};

export default UserContext;
