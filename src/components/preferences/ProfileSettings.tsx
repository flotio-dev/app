"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@mui/material/styles";
import { useState, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useApi } from "@/hooks/useApi";

function ProfileSettings() {
  const theme = useTheme();
  const { request } = useApi();
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.username || "",
    email: user?.email || "",
    github_id: "",
    github_username: "",
  });

  // Keep profile in sync with AuthContext if it loads late
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
        const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/auth/@me`);
        if (res.ok) {
          const data = await res.json();
          setProfile((prev) => ({
            ...prev,
            // Prioritize API data, but fallback to prev/user context if API missing fields
            name: data.username || prev.name || "",
            email: data.email || prev.email || "",
            github_id: data.github_id || "",
            github_username: data.github_username || "",
          }));
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/auth/@me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.name,
          email: profile.email,
          github_id: profile.github_id,
          github_username: profile.github_username,
        }),
      });
      if (res.ok) {
        setIsEditing(false);
        if (user) {
          updateUser({
            ...user,
            username: profile.name,
            email: profile.email,
          });
        }
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  return (
    <Box
      borderRadius={2}
      p={4}
      mb={4}
      boxShadow={1}
      border={`1px solid ${theme.palette.divider}`}
      bgcolor={theme.palette.background.paper}
    >
      <Typography variant="h6" fontWeight={600} mb={0.5} color={theme.palette.text.primary}>
        Public Profile
      </Typography>
      <Typography variant="body2" mb={3} color={theme.palette.text.secondary}>
        Manage how you appear to other team members.
      </Typography>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} alignItems="flex-start">
        <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
          <Avatar
            sx={{ width: 80, height: 80, border: `2px solid ${theme.palette.primary.main}`, fontWeight: 700, fontSize: 40, bgcolor: theme.palette.primary.main, color: theme.palette.getContrastText(theme.palette.primary.main) }}
          >
            {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
          </Avatar>
        </Box>
        <Box flex={1} display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
          <TextField
            label="Name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            fullWidth
            size="small"
            disabled={!isEditing}
            sx={{
              bgcolor: theme.palette.background.default,
              borderRadius: 1,
            }}
            InputLabelProps={{ style: { color: theme.palette.text.secondary, fontSize: 12 }, shrink: true }}
            InputProps={{ style: { color: theme.palette.text.primary, fontSize: 14 } }}
          />
          <TextField
            label="Email Address"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            fullWidth
            size="small"
            disabled={!isEditing}
            sx={{
              bgcolor: theme.palette.background.default,
              borderRadius: 1,
            }}
            InputLabelProps={{ style: { color: theme.palette.text.secondary, fontSize: 12 }, shrink: true }}
            InputProps={{ style: { color: theme.palette.text.primary, fontSize: 14 } }}
          />
          <Box gridColumn="1 / span 2" display="flex" justifyContent="flex-end" mt={1}>
            <Button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              variant="contained"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.getContrastText(theme.palette.primary.main),
                px: 3,
                py: 1,
                borderRadius: 1, // Keep original radius
                fontWeight: 500, // Keep original font weight
                fontSize: 14,
                boxShadow: 'none',
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              {isEditing ? "Save Changes" : "Modify"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default ProfileSettings;
