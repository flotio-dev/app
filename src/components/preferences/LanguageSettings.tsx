
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";

const LanguageSettings: React.FC = () => {
  const theme = useTheme();
  const [language, setLanguage] = useState("en");

  const handleChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value as string);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Save language logic
  };

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 3,
        p: 4,
        mb: 4,
        boxShadow: 2,
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        transition: 'background 0.2s, border 0.2s',
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={1} color={theme.palette.text.primary}>
        Language
      </Typography>
      <Typography variant="body2" mb={3} color={theme.palette.text.secondary}>
        Sélectionnez simplement la langue de l&apos;interface.
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel id="interface-language-label" sx={{ color: theme.palette.text.secondary }}>
            Interface language
          </InputLabel>
          <Select
            labelId="interface-language-label"
            id="interface-language"
            value={language}
            label="Interface language"
            onChange={handleChange}
            sx={{
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
              borderRadius: 2,
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <MenuItem value="en">EN &nbsp; English</MenuItem>
            <MenuItem value="fr">FR &nbsp; Français</MenuItem>
          </Select>
        </FormControl>
        <Box display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 500,
              fontSize: '0.95rem',
              borderRadius: 1,
              boxShadow: 'none',
              textTransform: 'none',
            }}
          >
            Save language
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default LanguageSettings;
