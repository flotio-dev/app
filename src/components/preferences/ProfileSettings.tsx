"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@mui/material/styles";
function ProfileSettings() {
  const theme = useTheme();
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
            A
          </Avatar>
          <Button
            variant="outlined"
            sx={{ mt: 1, fontSize: 14, borderRadius: 1, color: theme.palette.text.primary, borderColor: theme.palette.divider }}
          >
            Upload New Image
          </Button>
          <Typography variant="caption" color={theme.palette.text.disabled}>
            JPG, GIF or PNG. Max size 2MB.
          </Typography>
        </Box>
        <Box component="form" flex={1} display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
          <TextField
            label="First Name"
            defaultValue="Arthur"
            fullWidth
            size="small"
            sx={{
              bgcolor: theme.palette.background.default,
              borderRadius: 1,
            }}
            InputLabelProps={{ style: { color: theme.palette.text.secondary, fontSize: 12 } }}
            InputProps={{ style: { color: theme.palette.text.primary, fontSize: 14 } }}
          />
          <TextField
            label="Email Address"
            defaultValue="arthurdelautre@gmail.com"
            fullWidth
            size="small"
            sx={{
              gridColumn: '1 / span 2',
              bgcolor: theme.palette.background.default,
              borderRadius: 1,
            }}
            InputLabelProps={{ style: { color: theme.palette.text.secondary, fontSize: 12 } }}
            InputProps={{ style: { color: theme.palette.text.primary, fontSize: 14 } }}
          />
          <Box gridColumn="1 / span 2" display="flex" justifyContent="flex-end" mt={1}>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.getContrastText(theme.palette.primary.main),
                px: 3,
                py: 1,
                borderRadius: 1,
                fontWeight: 500,
                fontSize: 14,
                boxShadow: 'none',
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default ProfileSettings;
