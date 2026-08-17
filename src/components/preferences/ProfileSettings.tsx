"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useApi } from "@/hooks/useApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FiUser, FiMail, FiEdit2, FiCheck, FiX } from "react-icons/fi";

export default function ProfileSettings() {
  const { client } = useApi();
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.username || "",
    email: user?.email || "",
  });

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: prev.name || user.username || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // UserResponse = {id, username, email, created} — strictly no github fields (U-1).
        const data = await client.auth.getMe();
        setProfile((prev) => ({
          ...prev,
          name: data.username || prev.name || "",
          email: data.email || prev.email || "",
        }));
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [client]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await client.auth.updateMe({
        username: profile.name,
        email: profile.email,
      });
      setIsEditing(false);
      if (user) {
        updateUser({
          ...user,
          username: profile.name,
          email: profile.email,
        });
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = profile.name
    ? profile.name.slice(0, 2).toUpperCase()
    : profile.email
    ? profile.email.slice(0, 2).toUpperCase()
    : "FL";

  return (
    <Card className="p-0 overflow-hidden mb-6 border-zinc-800 bg-zinc-950">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FiUser className="h-4 w-4 text-cyan-400" />
          <CardTitle>Public Profile</CardTitle>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiX className="h-3 w-3" />}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<FiCheck className="h-3 w-3" />}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FiEdit2 className="h-3 w-3" />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 border-2 border-zinc-700 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg">
            {initials}
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <Input
              label="Username"
              value={profile.name}
              disabled={!isEditing}
              leftElement={<FiUser className="h-3.5 w-3.5" />}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              className="bg-zinc-900 border-zinc-800"
            />

            <Input
              label="Email Address"
              value={profile.email}
              disabled={!isEditing}
              leftElement={<FiMail className="h-3.5 w-3.5" />}
              onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
