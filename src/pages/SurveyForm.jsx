import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Grid,
  Paper,
  MenuItem,
  Container,
  RadioGroup,
  Radio,
  IconButton,
  InputAdornment,
  Checkbox,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Fade,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  AddCircleOutline,
  Delete,
  Person,
  Badge,
  ArrowBack,
  ArrowForward,
  Save,
  CheckCircle,
  CheckCircleOutline,
  Work,
  Business,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const primaryRed = "#B22222";
const lightGray = "#f8f9fa";

const steps = [
  "Utambulisho (PF)",
  "Taarifa za Utumishi",
  "Hali ya Mafunzo",
  "Maelezo ya Mafunzo",
  "Hakiki na Tuma",
];

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.style.marginTop = '70px';
  }
});

export default function SurveyForm({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pfSearched, setPfSearched] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    employeeId: "",
    position: "",
    department: "",
    section: "",
    location: "",
    hasTraining: "no",
    trainingHistory: [
      {
        trainingType: "",

        trainingDuration: "",
        institution: "",
        sponsor: "",
        startDate: "",
        endDate: "",
      },
    ],
    noTrainingReasons: [],
    otherReasons: "",
    readyForTraining: "yes",
  });

  // Fetch all users on mount for instant lookup
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch("/api/users?size=1000000");
        const data = await response.json();
        if (data?.data) {
          setUsers(data.data);
        } else if (Array.isArray(data)) {
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };


    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/v1/departments?pageSize=1000&size=1000");
        const data = await response.json();
        if (data?.data) {
          setDepartments(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };

    fetchUsers();
    fetchDepartments();
  }, []);



  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));

    if (name === "employeeId") {
      handlePfLookup(value);
    }
  };

  const handlePfLookup = React.useCallback((value) => {
    const searchValue = value.trim();
    // Best practice from Register.jsx: Match strictly on badgeNumber first
    const foundUser = users.find(u => String(u?.badgeNumber) === searchValue);

    if (foundUser) {
      // Best practice: Use 'name' field directly as primary source
      const extractedName = foundUser.name || foundUser.full_name;

      // Attempt to map Department Name to ID
      const userDeptName = foundUser.department?.name || foundUser.department || foundUser.dept || "";
      const matchedDept = departments.find(d => d.name.toLowerCase() === userDeptName.toLowerCase());
      const matchedDeptId = matchedDept ? matchedDept.id : "";

      setForm(prev => ({
        ...prev,
        fullName: extractedName || "",
        position: foundUser.designation || foundUser.position || foundUser.job_title || "",
        department: matchedDeptId, // Use ID if found
        section: "", // Reset section on new user lookup
      }));
      setPfSearched(true);
      if (extractedName) {
        Toast.fire({
          icon: 'success',
          title: `Karibu, ${extractedName}`
        });
      }
    } else {
      setPfSearched(false);
      // Clear autofilled fields if they keep typing but match is lost
      if (searchValue.length > 5 && form.fullName) {
        setForm(prev => ({
          ...prev,
          fullName: "",
          position: "",
          department: "",
          section: "",
        }));
      }
    }
  }, [users, departments, form.fullName]);

  // Re-run lookup when users data loads (in case user typed before load finished)
  // Re-run lookup when users data loads (in case user typed before load finished)
  useEffect(() => {
    if (users.length > 0 && form.employeeId && !form.fullName) {
      handlePfLookup(form.employeeId);
    }
  }, [users, form.employeeId, form.fullName, handlePfLookup]);

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    let updatedReasons = [...form.noTrainingReasons];
    if (checked) {
      updatedReasons.push(name);
    } else {
      updatedReasons = updatedReasons.filter((r) => r !== name);
    }
    setForm((prevForm) => ({ ...prevForm, noTrainingReasons: updatedReasons }));
  };

  const handleTrainingHistoryChange = (e, index) => {
    const { name, value } = e.target;
    const updatedHistory = [...form.trainingHistory];
    updatedHistory[index] = { ...updatedHistory[index], [name]: value };
    setForm((prevForm) => ({
      ...prevForm,
      trainingHistory: updatedHistory,
    }));
  };

  const addTraining = () => {
    setForm({
      ...form,
      trainingHistory: [
        ...form.trainingHistory,
        {
          trainingType: "",

          trainingDuration: "",
          institution: "",
          sponsor: "",
          startDate: "",
          endDate: "",
        },
      ],
    });
  };

  const removeTraining = (index) => {
    const updatedHistory = [...form.trainingHistory];
    updatedHistory.splice(index, 1);
    setForm({ ...form, trainingHistory: updatedHistory });
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!form.employeeId) {
          Toast.fire({ icon: 'warning', title: 'Tafadhali ingiza PF Number' });
          return false;
        }
        return true;
      case 1:
        if (!form.fullName || !form.position || !form.department || !form.section) {
          Toast.fire({ icon: 'warning', title: 'Tafadhali jaza taarifa zote za kazi' });
          return false;
        }
        return true;
      case 3:
        if (form.hasTraining === "yes") {
          const hasEmpty = form.trainingHistory.some(h => !h.trainingType || !h.institution || !h.sponsor || !h.startDate || !h.endDate);
          if (hasEmpty) {
            Toast.fire({ icon: 'warning', title: 'Tafadhali kamilisha maelezo yote ya mafunzo (ikiwemo tarehe)!' });
            return false;
          }

          // Validation: Check Date Range vs Training Type
          const today = new Date();
          for (const h of form.trainingHistory) {
            const start = new Date(h.startDate);
            const end = new Date(h.endDate);

            if (start > today || end > today) {
              Toast.fire({ icon: 'warning', title: 'Tarehe za mafunzo haziwezi kuwa za baadaye (future)!' });
              return false;
            }

            if (start >= end) {
              Toast.fire({ icon: 'warning', title: 'Tarehe ya kuanza haiwezi kuwa mbele ya kumaliza!' });
              return false;
            }

            // Calculate difference in months (approximate)
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffMonths = diffDays / 30.44; // Average days in month

            if (h.trainingType === 'short' && diffMonths > 6.5) { // Tolerance for "6 months"
              Toast.fire({ icon: 'warning', title: 'Umechagua Muda Mfupi, lakini tarehe zinaonyesha zaidi ya miezi 6. Tafadhali rekebisha.' });
              return false;
            }
            if (h.trainingType === 'long' && diffMonths < 5.5) { // Tolerance
              Toast.fire({ icon: 'warning', title: 'Umechagua Muda Mrefu, lakini tarehe zinaonyesha chini ya miezi 6. Tafadhali rekebisha.' });
              return false;
            }
          }
        } else {
          if (form.noTrainingReasons.length === 0 && !form.otherReasons) {
            Toast.fire({ icon: 'warning', title: 'Tafadhali chagua angalau sababu moja' });
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await MySwal.fire({
      title: 'Je, unathibitisha?',
      text: "Maelezo yako yatawasilishwa ORCI.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: primaryRed,
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Ndiyo, Tuma!',
      cancelButtonText: 'Ghairi'
    });

    if (result.isConfirmed) {
      MySwal.fire({
        title: 'Inawasilisha...',
        text: 'Tafadhali subiri.',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });

      try {
        // Map frontend state to backend model payload
        // Resolve names from IDs
        const deptObj = departments.find(d => d.id === form.department);
        const deptName = deptObj ? deptObj.name : form.department;

        const sectionObj = deptObj?.sections?.find(s => s.id === form.section);
        const sectionName = sectionObj ? sectionObj.name : form.section;

        // Map frontend state to backend model payload
        const payload = {
          pf_number: form.employeeId,
          full_name: form.fullName,
          department: deptName,
          section: sectionName,
          has_training: form.hasTraining,
          no_training_reasons: form.noTrainingReasons,
          other_reasons: form.otherReasons,
          ready_for_training: form.readyForTraining,
          training_history: form.hasTraining === "yes" ? form.trainingHistory.map(h => ({
            training_type: h.trainingType,
            institution: h.institution,
            start_date: h.startDate,
            end_date: h.endDate,
            sponsor: h.sponsor
          })) : []
        };

        const response = await fetch('/api/v1/responses/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Submission Error:", errorData);
          throw new Error('Kuna tatizo kwenye kuwasilisha data.');
        }

        MySwal.fire({
          icon: 'success',
          title: 'Imewasilishwa!',
          text: 'Taarifa zako zimepokelewa kikamilifu.',
          timer: 3000,
          timerProgressBar: true
        });

        // Reset form or redirect
        setActiveStep(0);
        setForm({
          pfNumber: "",
          fullName: "",
          currentPosition: "",
          department: "",
          section: "",
          hasTraining: "no",
          noTrainingReasons: [],
          readyForTraining: "",
          trainingHistory: [],
        });
        // Optional: Navigate to Dashboard if needed
        // onNavigate("dashboard");

      } catch (error) {
        console.error(error);
        MySwal.fire({
          icon: 'error',
          title: 'Imeshindikana',
          text: 'Tafadhali jaribu tena baadaye au wasiliana na IT.',
        });
      }
    }
  };

  const renderStepIcon = (props) => {
    const { active, completed, icon } = props;
    return (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: completed ? "#4caf50" : active ? primaryRed : "#e0e0e0",
          color: "white",
          fontWeight: "bold",
          fontSize: 14,
          transition: "all 0.3s ease",
          boxShadow: active ? "0 0 10px rgba(178, 34, 34, 0.4)" : "none",
        }}
      >
        {completed ? <CheckCircle sx={{ fontSize: 20 }} /> : icon}
      </Box>
    );
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={500}>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h5" sx={{ color: primaryRed, fontWeight: "bold", mb: 2 }}>
                Utambulisho wa Mtumishi
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", mb: 4 }}>
                Ingiza PF Number yako ili kuanza. Jina lako litavutwa kiotomatiki.
              </Typography>
              <Box sx={{ maxWidth: 400, mx: "auto" }}>
                <TextField
                  fullWidth
                  label="PF Number"
                  name="employeeId"
                  autoFocus
                  placeholder="Mfano: 202578"
                  value={form.employeeId}
                  onChange={handleFieldChange}
                  disabled={loadingUsers}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Badge color="action" /></InputAdornment>,
                    sx: { borderRadius: 3, bgcolor: "white" },
                    endAdornment: loadingUsers ? <CircularProgress size={20} /> : pfSearched ? <CheckCircleOutline color="success" /> : null
                  }}
                  sx={{ mb: 3 }}
                />

                {pfSearched && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: "#e8f5e9", borderRadius: 2, display: "flex", alignItems: "center", gap: 2 }}>
                    <CheckCircleOutline color="success" />
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      Jina Limepatikana: {form.fullName}
                    </Typography>
                  </Box>
                )}

                {!pfSearched && form.employeeId.length >= 4 && !loadingUsers && (
                  <Typography variant="caption" color="text.secondary">
                    Ukitoka kwenye hatua hii bado unaweza kujaza jina kwa mikono.
                  </Typography>
                )}
              </Box>
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h6" sx={{ color: primaryRed, fontWeight: "bold", mb: 3 }}>
                Taarifa za Kazi
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: "text.secondary", ml: 1, fontWeight: "bold" }}>Majina Kamili</Typography>
                  <TextField
                    fullWidth size="small" name="fullName" value={form.fullName} onChange={handleFieldChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment>,
                      sx: { bgcolor: lightGray, borderRadius: 2 }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: "text.secondary", ml: 1, fontWeight: "bold" }}>Nafasi ya Kazi</Typography>
                  <TextField
                    fullWidth size="small" name="position" value={form.position} onChange={handleFieldChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Work color="action" /></InputAdornment>, sx: { bgcolor: "white", borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: "text.secondary", ml: 1, fontWeight: "bold" }}>Idara (Department/Unit)</Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="department"
                    value={form.department}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, department: e.target.value, section: "" }));
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Business color="action" /></InputAdornment>,
                      sx: { bgcolor: "white", borderRadius: 2 }
                    }}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: "text.secondary", ml: 1, fontWeight: "bold" }}>Kitengo (Section)</Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="section"
                    value={form.section}
                    onChange={handleFieldChange}
                    disabled={!form.department}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Business color="action" /></InputAdornment>,
                      sx: { bgcolor: "white", borderRadius: 2 }
                    }}
                  >
                    {departments.find(d => d.id === form.department)?.sections?.map((sec) => (
                      <MenuItem key={sec.id} value={sec.id}>
                        {sec.name}
                      </MenuItem>
                    )) || <MenuItem value="" disabled>Chagua Idara Kwanza</MenuItem>}
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      case 2:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h6" sx={{ color: primaryRed, fontWeight: "bold", mb: 2 }}>
                Hali ya Mafunzo
              </Typography>
              <Paper variant="outlined" sx={{ p: 4, bgcolor: lightGray, borderRadius: 3, textAlign: "center" }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                  Je, tangu uajiriwe umewahi kupata mafunzo yoyote (Ikiwemo on-job training)?
                </Typography>
                <RadioGroup row name="hasTraining" value={form.hasTraining} onChange={handleFieldChange} sx={{ justifyContent: "center" }}>
                  <FormControlLabel
                    value="yes"
                    control={<Radio color="success" />}
                    label="Ndiyo, nimepata"
                    sx={{
                      bgcolor: form.hasTraining === "yes" ? "#e8f5e9" : "white",
                      px: 5,
                      py: 1.5,
                      borderRadius: 10,
                      mr: 4,
                      border: "2px solid",
                      borderColor: form.hasTraining === "yes" ? "#4caf50" : "#ddd",
                      transition: "all 0.2s",
                      boxShadow: form.hasTraining === "yes" ? 2 : 0
                    }}
                  />
                  <FormControlLabel
                    value="no"
                    control={<Radio color="error" />}
                    label="Hapana bado"
                    sx={{
                      bgcolor: form.hasTraining === "no" ? "#ffebee" : "white",
                      px: 5,
                      py: 1.5,
                      borderRadius: 10,
                      border: "2px solid",
                      borderColor: form.hasTraining === "no" ? "#f44336" : "#ddd",
                      transition: "all 0.2s",
                      boxShadow: form.hasTraining === "no" ? 2 : 0
                    }}
                  />
                </RadioGroup>
              </Paper>
            </Box>
          </Fade>
        );

      case 3:
        return (
          <Fade in timeout={500}>
            <Box>
              {form.hasTraining === "yes" ? (
                <Box>
                  <Typography variant="h6" sx={{ color: primaryRed, fontWeight: "bold", mb: 2 }}>
                    Taarifa za Mafunzo Uliyopata
                  </Typography>
                  {form.trainingHistory.map((history, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3, position: "relative", border: "1px solid #eee" }}>
                      <Stack direction="row" justifyContent="space-between" mb={2}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryRed }}>MAFUNZO #{index + 1}</Typography>
                        {form.trainingHistory.length > 1 && (
                          <IconButton size="small" color="error" onClick={() => removeTraining(index)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ fontWeight: "bold" }}>Muda wa Mafunzo</Typography>
                          <RadioGroup name="trainingType" value={history.trainingType} onChange={(e) => handleTrainingHistoryChange(e, index)}>
                            <FormControlLabel value="short" control={<Radio size="small" />} label="Muda Mfupi (Miezi 6 kushuka chini)" />
                            <FormControlLabel value="long" control={<Radio size="small" />} label="Muda Mrefu (Miezi 6 na kuendelea)" />
                          </RadioGroup>
                        </Grid>
                        <Grid item xs={12} md={12}>
                          <Typography variant="caption" sx={{ fontWeight: "bold", display: 'block', mb: 1 }}>Ninani aliye dhamini mafunzo hayo?</Typography>
                          <RadioGroup row name="sponsor" value={history.sponsor} onChange={(e) => handleTrainingHistoryChange(e, index)}>
                            <FormControlLabel value="Taasisi" control={<Radio size="small" />} label="Taasisi" />
                            <FormControlLabel value="Wadau wengine" control={<Radio size="small" />} label="Wadau wengine" />
                            <FormControlLabel value="Binafsi" control={<Radio size="small" />} label="Binafsi" />
                          </RadioGroup>
                        </Grid>
                        <Grid item xs={12}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Chuo/Taasisi"
                                name="institution"
                                value={history.institution}
                                onChange={(e) => handleTrainingHistoryChange(e, index)}
                                placeholder="Jina la Chuo au Taasisi"
                                sx={{ bgcolor: "white" }}
                              />
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <TextField fullWidth size="small" type="date" label="Kuanza" name="startDate" value={history.startDate} onChange={(e) => handleTrainingHistoryChange(e, index)} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <TextField fullWidth size="small" type="date" label="Kumaliza" name="endDate" value={history.endDate} onChange={(e) => handleTrainingHistoryChange(e, index)} InputLabelProps={{ shrink: true }} />
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  <Button variant="outlined" fullWidth startIcon={<AddCircleOutline />} onClick={addTraining} sx={{ color: primaryRed, borderColor: primaryRed, borderRadius: 2, py: 1.5, borderStyle: "dashed", "&:hover": { borderStyle: "solid" } }}>
                    Ongeza Historia Nyingine
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" sx={{ color: primaryRed, fontWeight: "bold", mb: 3 }}>
                    Kwa nini hujawahi kupata mafunzo?
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={7}>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 2 }}>Chagua sababu(zote) zinazokuhusu:</Typography>
                        <FormGroup>
                          {["Hukuwahi kuteuliwa", "Hakukuwa na fursa", "Sababu binafsi", "Sababu za kiafya"].map((reason) => (
                            <FormControlLabel key={reason} control={<Checkbox size="small" checked={form.noTrainingReasons.includes(reason)} name={reason} onChange={handleCheckboxChange} />} label={reason} />
                          ))}
                          {(form.noTrainingReasons.includes("Sababu nyinginezo") || true) && (
                            <TextField
                              fullWidth
                              size="small"
                              multiline
                              rows={2}
                              name="otherReasons"
                              value={form.otherReasons}
                              onChange={handleFieldChange}
                              placeholder="Sababu nyinginezo (Eleza hapa)..."
                              sx={{ mt: 2, bgcolor: lightGray }}
                            />
                          )}
                        </FormGroup>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fffce8", border: "1px solid #ffcc00" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 2 }}>Je: Uko tayari kupata mafunzo pindi fursa itapatikana?</Typography>
                        <RadioGroup name="readyForTraining" value={form.readyForTraining} onChange={handleFieldChange}>
                          <FormControlLabel value="yes" control={<Radio size="small" color="warning" />} label="Ndiyo, niko tayari" />
                          <FormControlLabel value="no" control={<Radio size="small" color="warning" />} label="Hapana, sio kwa sasa" />
                        </RadioGroup>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )
              }
            </Box>
          </Fade>
        );

      case 4:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h6" sx={{ color: primaryRed, fontWeight: "bold", mb: 3 }}>
                Hakiki Taarifa Zako
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: primaryRed, borderBottom: "1px solid #eee", pb: 1, mb: 1, fontWeight: "bold" }}>Taarifa Binafsi</Typography>
                    <List dense>
                      <ListItem sx={{ px: 0 }}><ListItemText primary="Majina Kamili" secondary={form.fullName} /></ListItem>
                      <ListItem sx={{ px: 0 }}><ListItemText primary="PF Number" secondary={form.employeeId} /></ListItem>
                      <ListItem sx={{ px: 0 }}><ListItemText primary="Idara" secondary={departments.find(d => d.id === form.department)?.name || form.department} /></ListItem>
                      <ListItem sx={{ px: 0 }}><ListItemText primary="Kitengo" secondary={departments.find(d => d.id === form.department)?.sections?.find(s => s.id === form.section)?.name || form.section} /></ListItem>
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: primaryRed, borderBottom: "1px solid #eee", pb: 1, mb: 1, fontWeight: "bold" }}>Hali ya Mafunzo</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={form.hasTraining === "yes" ? "Umeshapata Mafunzo" : "Hujapata Mafunzo"}
                        color={form.hasTraining === "yes" ? "success" : "warning"}
                        icon={<CheckCircleOutline />}
                        sx={{ px: 2, height: 40, fontSize: "1rem" }}
                      />
                      {form.hasTraining === "yes" && (
                        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
                          Umekamilisha maelezo ya mafunzo: <strong>{form.trainingHistory.length}</strong>
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
              <Typography variant="body2" sx={{ mt: 6, color: "text.secondary", fontStyle: "italic", textAlign: "center" }}>
                Kwa kubonyeza "Tuma Dodoso", unathibitisha kuwa taarifa hizi ni sahihi.
              </Typography>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ bgcolor: "#F4F7F6", minHeight: "calc(100vh - 64px)", pb: 6 }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ color: primaryRed, fontWeight: 800, textAlign: "center", mb: 1 }}>
            e-Dodoso la Mafunzo
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", mb: 5 }}>
            Tafadhali kamilisha hatua zote ili kurahisisha upangaji wa fursa za masomo.
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel StepIconComponent={renderStepIcon}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: "0 10px 40px rgba(0,0,0,0.06)", bgcolor: "white", minHeight: 450, display: "flex", flexDirection: "column" }}>
          <Box sx={{ flexGrow: 1 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Divider sx={{ my: 4 }} />

          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Box>
              <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ArrowBack />} sx={{ color: "text.secondary", px: 3, borderRadius: 2 }}>
                Rudi Nyuma
              </Button>
            </Box>

            <Box>
              {activeStep === steps.length - 1 ? (
                <Button variant="contained" onClick={handleSubmit} startIcon={<Save />} sx={{ bgcolor: primaryRed, px: 6, py: 1.5, borderRadius: 2, fontWeight: "bold", "&:hover": { bgcolor: "#8B0000" } }}>
                  Tuma Dodoso
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={activeStep === 0 && !form.employeeId}
                  endIcon={<ArrowForward />}
                  sx={{ bgcolor: primaryRed, px: 6, py: 1.5, borderRadius: 2, fontWeight: "bold", "&:hover": { bgcolor: "#8B0000" } }}
                >
                  Endelea
                </Button>
              )}
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
