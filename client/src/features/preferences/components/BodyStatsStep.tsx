import {
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { BodyStats, Gender, UnitSystem } from '@/shared';
import { ftInToCm, lbToKg } from '@/shared';

interface BodyStatsStepProps {
  value: Partial<BodyStats>;
  onChange: (patch: Partial<BodyStats>) => void;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function BodyStatsStep({ value, onChange }: BodyStatsStepProps) {
  const [unit, setUnit] = useState<UnitSystem>(value.unitSystem ?? 'metric');
  const [age, setAge] = useState(value.age ? String(value.age) : '');
  const [gender, setGender] = useState<Gender | ''>(value.gender ?? '');

  // Display inputs (raw strings; canonical metric is derived and pushed up).
  const [kg, setKg] = useState(
    value.unitSystem !== 'us' && value.weightKg ? String(value.weightKg) : '',
  );
  const [cm, setCm] = useState(
    value.unitSystem !== 'us' && value.heightCm ? String(value.heightCm) : '',
  );
  // For a returning US-unit user, seed lb/ft/in from the stored canonical metric.
  const [lb, setLb] = useState(
    value.unitSystem === 'us' && value.weightKg
      ? String(round1(value.weightKg / 0.453592))
      : '',
  );
  const [ft, setFt] = useState(
    value.unitSystem === 'us' && value.heightCm
      ? String(Math.floor(value.heightCm / 2.54 / 12))
      : '',
  );
  const [inch, setInch] = useState(
    value.unitSystem === 'us' && value.heightCm
      ? String(Math.round((value.heightCm / 2.54) % 12))
      : '',
  );

  // Push canonical (metric) values up whenever any input changes.
  useEffect(() => {
    const weightKg =
      unit === 'metric' ? Number(kg) : lb ? round1(lbToKg(Number(lb))) : 0;
    const heightCm =
      unit === 'metric'
        ? Number(cm)
        : ft || inch
          ? round1(ftInToCm(Number(ft || 0), Number(inch || 0)))
          : 0;

    onChange({
      weightKg,
      heightCm,
      age: Number(age) || 0,
      gender: gender || undefined,
      unitSystem: unit,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, kg, cm, lb, ft, inch, age, gender]);

  const handleUnitChange = (next: UnitSystem | null) => {
    if (!next || next === unit) return;
    // Convert current entry so the user does not lose data on toggle.
    if (next === 'us') {
      if (kg) setLb(String(round1(Number(kg) / 0.453592)));
      if (cm) {
        const totalIn = Number(cm) / 2.54;
        setFt(String(Math.floor(totalIn / 12)));
        setInch(String(Math.round(totalIn % 12)));
      }
    } else {
      if (lb) setKg(String(round1(lbToKg(Number(lb)))));
      if (ft || inch)
        setCm(String(round1(ftInToCm(Number(ft || 0), Number(inch || 0)))));
    }
    setUnit(next);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Box>
        <Typography variant="h2" sx={{ mb: '0.5rem' }}>
          About You
        </Typography>
        <Typography color="text.secondary">
          We use this to estimate your daily calories
        </Typography>
      </Box>

      <ToggleButtonGroup
        exclusive
        fullWidth
        value={unit}
        onChange={(_, next) => handleUnitChange(next)}
        color="primary"
      >
        <ToggleButton value="metric">Metric (kg, cm)</ToggleButton>
        <ToggleButton value="us">US (lb, ft/in)</ToggleButton>
      </ToggleButtonGroup>

      {unit === 'metric' ? (
        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <TextField
            fullWidth
            label="Weight (kg)"
            type="number"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
          />
          <TextField
            fullWidth
            label="Height (cm)"
            type="number"
            value={cm}
            onChange={(e) => setCm(e.target.value)}
          />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <TextField
            fullWidth
            label="Weight (lb)"
            type="number"
            value={lb}
            onChange={(e) => setLb(e.target.value)}
          />
          <TextField
            label="Height (ft)"
            type="number"
            value={ft}
            onChange={(e) => setFt(e.target.value)}
            sx={{ width: '50%' }}
          />
          <TextField
            label="(in)"
            type="number"
            value={inch}
            onChange={(e) => setInch(e.target.value)}
            sx={{ width: '50%' }}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <TextField
          label="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          sx={{ width: '40%' }}
        />
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={gender}
          onChange={(_, next) => next && setGender(next)}
          color="primary"
          sx={{ flex: 1 }}
        >
          <ToggleButton value="male">Male</ToggleButton>
          <ToggleButton value="female">Female</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}
