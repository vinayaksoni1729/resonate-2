import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  StepLabel,
  Step,
  Stepper,
} from "@mui/material";
import { motion } from "framer-motion";
import bg from "../assets/images/bg-space.jpeg";
import paymentQR from "../assets/images/payment_qr.png";

const REGISTRATION_OPEN = false;

const Form = () => {
  const [formData, setFormData] = useState({
    teamName: "",
    numberOfMembers: "",
    trackChoice: "",
    members: [], 
    paymentProof: null,
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const stepperRef = useRef(null);

  useEffect(() => {
    if (stepperRef.current) {
      const stepperContainer = stepperRef.current;
      const steps = stepperContainer.querySelectorAll('[class*="MuiStep-root"]');
      
      if (steps[activeStep]) {
        const activeStepElement = steps[activeStep];
        const containerRect = stepperContainer.getBoundingClientRect();
        const stepRect = activeStepElement.getBoundingClientRect();
        
        // Calculate scroll position to center the active step
        const scrollLeft = stepperContainer.scrollLeft + (stepRect.left - containerRect.left) - (containerRect.width / 2) + (stepRect.width / 2);
        
        stepperContainer.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [activeStep]);

  useEffect(() => {
    const wakeUpBackend = async () => {
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://resonate-2.onrender.com'}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch {
        console.log("Backend wake-up call sent");
      }
    };

    const timer = setTimeout(() => {
      wakeUpBackend();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getSteps = () => {
    const baseSteps = ["About", "Team Details"];
    const numMembers = parseInt(formData.numberOfMembers) || 0;
    
    for (let i = 1; i <= numMembers; i++) {
      if (i === 1) {
        baseSteps.push("Member 1 (Leader)");
      } else {
        baseSteps.push(`Member ${i}`);
      }
    }
    
    baseSteps.push("Payment");
    return baseSteps;
  };

  const steps = getSteps();

  const validate = (step) => {
    const newErrors = {};
    const numMembers = parseInt(formData.numberOfMembers) || 0;
    
    if (step === 0) {
      return newErrors;
    } else if (step === 1) {
      if (!formData.teamName.trim()) {
        newErrors.teamName = "Team name is required";
      }
      if (!formData.numberOfMembers) {
        newErrors.numberOfMembers = "Please select number of members";
      }
      if (!formData.trackChoice) {
        newErrors.trackChoice = "Please select a hackathon track";
      }
    } else if (step >= 2 && step < 2 + numMembers) {
      const memberIndex = step - 2;
      const member = formData.members[memberIndex];
      
      if (!member || !member.name || !member.name.trim()) {
        newErrors.name = "Name is required";
      } else if (!/^[a-zA-Z\s]+$/.test(member.name)) {
        newErrors.name = "Name should contain only alphabets";
      }
      
      if (!member || !member.registerNumber || !member.registerNumber.trim()) {
        newErrors.registerNumber = "Register number is required";
      } else if (!/^RA[0-9]{13}$/.test(member.registerNumber)) {
        newErrors.registerNumber = "Register number must be in the format RA followed by 13 digits";
      }
      
      if (memberIndex === 0) {
        if (!member || !member.personalEmail || !member.personalEmail.trim()) {
          newErrors.personalEmail = "Personal email is required";
        } else if (!/^\S+@\S+\.\S+$/.test(member.personalEmail)) {
          newErrors.personalEmail = "Please enter a valid email address";
        }
        
        if (!member || !member.phoneNumber || !member.phoneNumber.trim()) {
          newErrors.phoneNumber = "Phone number is required";
        } else if (!/^\d{10}$/.test(member.phoneNumber)) {
          newErrors.phoneNumber = "Phone number should be 10 digits";
        }
      }
    } else if (step === 2 + numMembers) {
      if (!formData.paymentProof) {
        newErrors.paymentProof = "Payment proof is required";
      }
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (name === "numberOfMembers") {
      const numMembers = parseInt(value);
      const newMembers = Array(numMembers).fill(null).map((_, index) => 
        formData.members[index] || {
          name: "",
          registerNumber: "",
          hostelName: "",
          ...(index === 0 ? {
            personalEmail: "",
            phoneNumber: "",
          } : {})
        }
      );
      setFormData(prev => ({
        ...prev,
        numberOfMembers: value,
        members: newMembers,
      }));
    }
  };

  const handleMemberChange = (memberIndex, field, value) => {
    const newMembers = [...formData.members];
    newMembers[memberIndex] = {
      ...newMembers[memberIndex],
      [field]: value,
    };
    setFormData({
      ...formData,
      members: newMembers,
    });
  };

  const handleRegisterNumberChange = (memberIndex, value) => {
    handleMemberChange(memberIndex, "registerNumber", value.toUpperCase());
  };

  const handlePhoneNumberChange = (value) => {
    if (/^\d{0,10}$/.test(value)) {
      const newMembers = [...formData.members];
      newMembers[0] = {
        ...newMembers[0],
        phoneNumber: value,
      };
      setFormData({
        ...formData,
        members: newMembers,
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        paymentProof: file,
      });
    }
  };

  const handleNext = () => {
    const validationErrors = validate(activeStep);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors({});
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(activeStep);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      setLoading(true);
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('teamName', formData.teamName);
        formDataToSend.append('numberOfMembers', formData.numberOfMembers);
        formDataToSend.append('trackChoice', formData.trackChoice);
        
        const membersData = formData.members.map(member => {
          const memberData = {
            name: member.name,
            registerNumber: member.registerNumber,
          };
          
          if (member.hostelName && member.hostelName.trim()) {
            memberData.hostelName = member.hostelName;
          }
          
          if (formData.members.indexOf(member) === 0) {
            memberData.personalEmail = member.personalEmail;
            memberData.phoneNumber = member.phoneNumber;
          }
          
          return memberData;
        });
        
        formDataToSend.append('members', JSON.stringify(membersData));
        formDataToSend.append('paymentProof', formData.paymentProof);

        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL || 'https://resonate-2.onrender.com'}/api/form`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        if (response.status === 201) {
          setSubmitted(true);
        }
      } catch (err) {
        if (err.response && err.response.status === 400) {
          setDuplicateDialogOpen(true);
        } else {
          alert("Error submitting form");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const errorStyle = {
    color: "#F28B82", 
    mt: 1,
    textAlign: "right",
  };

  if (!REGISTRATION_OPEN) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "#111111",
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          sx={{
            maxWidth: "600px",
            padding: { xs: "2rem", md: "3rem" },
            borderRadius: "20px",
            background: "rgba(17, 17, 17, 0.95)",
            border: "2px solid #C77DFF",
            boxShadow: "0 0 40px rgba(199, 125, 255, 0.3)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "2rem", md: "2.5rem" },
              marginBottom: "1rem",
              color: "#C77DFF",
              fontWeight: 700,
              fontFamily: "Roboto",
            }}
          >
            Registrations Closed 🚀
          </Typography>

          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "1rem", md: "1.1rem" },
              lineHeight: "1.8",
              color: "rgba(249, 241, 230, 0.9)",
              marginBottom: "1.5rem",
              fontFamily: "Roboto",
            }}
          >
            Thank you for the overwhelming response!
            <br />
            We&apos;ve reached full capacity for{" "}
            <strong style={{ color: "#C77DFF" }}>Resonate Hackathon 2.0</strong>.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              marginTop: "1rem",
              opacity: 0.9,
              color: "rgba(249, 241, 230, 0.8)",
              fontSize: { xs: "0.95rem", md: "1rem" },
              fontFamily: "Roboto",
            }}
          >
            Stay tuned for next year&apos;s edition ✨
          </Typography>

          <Typography
            variant="body2"
            sx={{
              marginTop: "2rem",
              opacity: 0.7,
              color: "rgba(199, 125, 255, 0.7)",
              fontSize: "0.9rem",
              fontFamily: "Roboto",
            }}
          >
            See you in 2027!
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Container
      maxWidth="lg"
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "0",
        margin: 0,
        minWidth: "100vw",
        backgroundColor: "#111111",
      }}
    >
      {/* Left Box with Background and Typography */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: { xs: "60vh", md: "94.5vh" },
          width: { xs: "100%", md: "50%" },
          backgroundColor: "#111111",
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: { xs: "0px 0px 0px 50px", md: "0px 0px 0px 70px" },
        }}
      >
        
      </Box>

      {/* Right Box with Form */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "94.5vh",
          backgroundColor: "#111111",
          padding: { xs: "20px 0px 0px 0px", md: "0px" },
          margin: 0,
          flexGrow: 1,
        }}
      >
        {submitted ? (
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, md: 4 },
              backgroundColor: "#111",
              borderRadius: 2,
              width: { xs: "80vw", md: "100%" },
              maxWidth: { xs: "400px", md: "590px" },
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Registration Details */}
            {/* The rest of the submitted content */}
            <Box sx={{ overflowX: "auto", overflowY: "hidden", mb: 4, width: "100%" }}>
              <Stepper
                activeStep={steps.length}
                alternativeLabel
                sx={{
                  width: "100%",
                  minWidth: { xs: "max-content", md: "100%" },
                  "& .MuiStepIcon-root": {
                    color: "#333333",
                    fontSize: { xs: "1rem", md: "1.5rem" },
                    "&.Mui-active": {
                      color: "#C77DFF",
                    },
                    "&.Mui-completed": {
                      color: "#C77DFF",
                    },
                  },
                  "& .MuiStepLabel-label": {
                    color: "#BDBDBD",
                    fontFamily: "Roboto",
                    fontSize: { xs: "10px", md: "16px" },
                    fontWeight: 700,
                    lineHeight: { xs: "14px", md: "24px" },
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    "&.Mui-active": {
                      color: "#C77DFF",
                    },
                    "&.Mui-completed": {
                      color: "#C77DFF",
                    },
                  },
                  "& .MuiStep-root": {
                    minWidth: { xs: "60px", md: "auto" },
                    flex: { xs: "0 0 auto", md: "1 1 auto" },
                  },
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            {/* Success Message */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                py: 6,
              }}
            >
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontFamily: "Roboto",
                  fontSize: { xs: "28px", md: "36px" },
                  fontWeight: 700,
                  lineHeight: "1.4",
                  color: "#C77DFF",
                  mb: 3,
                }}
              >
                🎉 Registration Successful! 🎉
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Roboto",
                  fontSize: { xs: "18px", md: "22px" },
                  fontWeight: 500,
                  lineHeight: "1.6",
                  color: "rgba(249, 241, 230, 0.9)",
                  mb: 2,
                }}
              >
                You&apos;ve successfully registered for Resonate Hackathon!
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontFamily: "Roboto",
                  fontSize: { xs: "14px", md: "16px" },
                  fontWeight: 400,
                  lineHeight: "1.8",
                  color: "rgba(249, 241, 230, 0.7)",
                  mb: 4,
                  maxWidth: "500px",
                }}
              >
                We&apos;re excited to have you join us! Keep checking your email for further updates and event details.
                <br />
                <br />
                See you at the event! 🚀
              </Typography>

              <Box
                sx={{
                  backgroundColor: "rgba(199, 125, 255, 0.1)",
                  border: "1px solid rgba(199, 125, 255, 0.3)",
                  borderRadius: 2,
                  padding: { xs: "15px", md: "20px" },
                  mt: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Roboto",
                    fontSize: { xs: "12px", md: "14px" },
                    fontWeight: 400,
                    lineHeight: "1.6",
                    color: "rgba(249, 241, 230, 0.8)",
                  }}
                >
                  <strong>Event Date:</strong> 3 & 4 April
                  <br />
                  <strong>Venue:</strong> Mini Hall 2
                </Typography>
              </Box>
            </Box>
          </Paper>
        ) : (
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              backgroundColor: "#111",
              borderRadius: 2,
              height: { md: "auto", xs: "auto" },
              maxHeight: { md: "90vh" },
              width: { xs: "80vw", md: "100%" },
              maxWidth: { xs: "400px", md: "590px" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              overflow: "hidden",
              flexGrow: 1,
            }}
          >
            <Box ref={stepperRef} sx={{ overflowX: "auto", overflowY: "hidden", mb: 1, width: "100%", scrollBehavior: "smooth", flexShrink: 0 }}>
              <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{
                  width: "100%",
                  minWidth: { xs: "max-content", md: "100%" },
                  py: { xs: 1, md: 0.5 },
                  "& .MuiStepIcon-root": {
                    color: "#333333",
                    fontSize: { xs: "1rem", md: "1.25rem" },
                    "&.Mui-active": {
                      color: "#C77DFF",
                    },
                    "&.Mui-completed": {
                      color: "#C77DFF",
                    },
                  },
                  "& .MuiStepLabel-label": {
                    color: "#BDBDBD",
                    fontFamily: "Roboto",
                    fontSize: { xs: "9px", md: "13px" },
                    fontWeight: 700,
                    lineHeight: { xs: "12px", md: "18px" },
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    "&.Mui-active": {
                      color: "#C77DFF",
                    },
                    "&.Mui-completed": {
                      color: "#C77DFF",
                    },
                  },
                  "& .MuiStep-root": {
                    minWidth: { xs: "60px", md: "auto" },
                    flex: { xs: "0 0 auto", md: "1 1 auto" },
                    py: { xs: 1, md: 0 },
                  },
                  "& .MuiStepConnector-root": {
                    my: { xs: 0.5, md: 0.25 },
                  },
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Form Content */}
            {/* Continue with the form fields and actions (Back, Next, Submit buttons) */}
            {/* Add Typography and Divider for the section header */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontFamily: "Roboto",
                  fontSize: { xs: "18px", md: "22px" },
                  fontWeight: 400,
                  lineHeight: "1.2",
                  textAlign: "left",
                  color: "rgba(249, 241, 230, 0.5)",
                  mb: 1,
                }}
              >
                {activeStep === 0 ? "About the Event" : `${steps[activeStep]} Information`}
              </Typography>
              <Divider
                sx={{
                  background: "rgba(249, 241, 230, 0.5)",
                  height: "2px",
                  mb: 2,
                }}
              />
            </Box>

            {/* Removed the `onSubmit` from the form and use button event handlers */}
            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                width: "100%",
                flexGrow: 1,
                overflowY: "auto",
                paddingRight: "8px",
              }}
            >
              {activeStep === 0 && (
                <>
                  {/* About the Event */}
                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: "#C77DFF", fontWeight: 600, mb: 0.5, fontSize: { xs: "14px", md: "16px" } }}
                    >
                      Hackathon Tracks
                    </Typography>
                    <Box sx={{ pl: 1.5 }}>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        1. HealthTech & Preventive Care Intelligence
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        2. Inclusive FinTech & Financial Wellness
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        3. Climate Tech & Sustainability Execution
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        4. Agentic AI & Workforce Augmentation
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        5. Smart Infrastructure & Urban Resilience
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: "#C77DFF", fontWeight: 600, mb: 0.5, fontSize: { xs: "14px", md: "16px" } }}
                    >
                      Event Details
                    </Typography>
                    <Box sx={{ pl: 1.5 }}>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        <strong>Venue:</strong> Mini Hall 2
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        <strong>Date:</strong> 3 & 4 April
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        <strong>Team Size:</strong> 2-4 members
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        <strong>Registration Fee:</strong> ₹200 per team
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: "#C77DFF", fontWeight: 600, mb: 0.5, fontSize: { xs: "14px", md: "16px" } }}
                    >
                      Prizes
                    </Typography>
                    <Box sx={{ pl: 1.5 }}>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        <strong>First Place:</strong> ₹15,000
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        <strong>Second Place:</strong> ₹10,000
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        <strong>Third Place:</strong> Internship opportunities and coupons
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 0.25, fontSize: { xs: "11px", md: "13px" } }}>
                        <strong>Fourth Place:</strong> Internship opportunities and coupons
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}

              {activeStep === 1 && (
                <>
                  {/* Team Details - Only team info */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ color: "white" }}
                    >
                      Team Name
                    </Typography>
                    <TextField
                      placeholder="Enter your team name"
                      name="teamName"
                      value={formData.teamName}
                      onChange={handleChange}
                      error={!!errors.teamName}
                      helperText={
                        errors.teamName && (
                          <Typography variant="body2" sx={errorStyle}>
                            {errors.teamName}
                          </Typography>
                        )
                      }
                      variant="outlined"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#F9F1E6",
                          borderRadius: 1,
                        },
                        "& .MuiFormHelperText-root": {
                          backgroundColor: "transparent",
                        },
                        "& .MuiOutlinedInput-root.Mui-error": {
                          "& fieldset": {
                            borderColor: "#F28B82",
                          },
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ color: "white" }}
                    >
                      Number of Team Members
                    </Typography>
                    <TextField
                      select
                      placeholder="Select number of members"
                      name="numberOfMembers"
                      value={formData.numberOfMembers}
                      onChange={handleChange}
                      error={!!errors.numberOfMembers}
                      helperText={
                        errors.numberOfMembers && (
                          <Typography variant="body2" sx={errorStyle}>
                            {errors.numberOfMembers}
                          </Typography>
                        )
                      }
                      variant="outlined"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#F9F1E6",
                          borderRadius: 1,
                        },
                        "& .MuiFormHelperText-root": {
                          backgroundColor: "transparent",
                        },
                        "& .MuiOutlinedInput-root.Mui-error": {
                          "& fieldset": {
                            borderColor: "#F28B82",
                          },
                        },
                      }}
                    >
                      <MenuItem value="2">2 Members</MenuItem>
                      <MenuItem value="3">3 Members</MenuItem>
                      <MenuItem value="4">4 Members</MenuItem>
                    </TextField>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ color: "white" }}
                    >
                      Choose Hackathon Track
                    </Typography>
                    <TextField
                      select
                      placeholder="Select a track"
                      name="trackChoice"
                      value={formData.trackChoice}
                      onChange={handleChange}
                      error={!!errors.trackChoice}
                      helperText={
                        errors.trackChoice && (
                          <Typography variant="body2" sx={errorStyle}>
                            {errors.trackChoice}
                          </Typography>
                        )
                      }
                      variant="outlined"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#F9F1E6",
                          borderRadius: 1,
                        },
                        "& .MuiFormHelperText-root": {
                          backgroundColor: "transparent",
                        },
                        "& .MuiOutlinedInput-root.Mui-error": {
                          "& fieldset": {
                            borderColor: "#F28B82",
                          },
                        },
                      }}
                    >
                      <MenuItem value="HealthTech & Preventive Care Intelligence">
                        HealthTech & Preventive Care Intelligence
                      </MenuItem>
                      <MenuItem value="Inclusive FinTech & Financial Wellness">
                        Inclusive FinTech & Financial Wellness
                      </MenuItem>
                      <MenuItem value="Climate Tech & Sustainability Execution">
                        Climate Tech & Sustainability Execution
                      </MenuItem>
                      <MenuItem value="Agentic AI & Workforce Augmentation">
                        Agentic AI & Workforce Augmentation
                      </MenuItem>
                      <MenuItem value="Smart Infrastructure & Urban Resilience">
                        Smart Infrastructure & Urban Resilience
                      </MenuItem>
                    </TextField>
                  </Box>
                </>
              )}

              {/* Dynamic Member Steps */}
              {(() => {
                const numMembers = parseInt(formData.numberOfMembers) || 0;
                const memberIndex = activeStep - 2;
                
                if (activeStep >= 2 && activeStep < 2 + numMembers && formData.members[memberIndex]) {
                  const member = formData.members[memberIndex];
                  const isLeader = memberIndex === 0;
                  
                  return (
                    <>
                      {/* Common fields for all members */}
                      <Box>
                        <Typography variant="subtitle1" gutterBottom sx={{ color: "white" }}>
                          Name
                        </Typography>
                        <TextField
                          placeholder="Enter full name"
                          value={member.name}
                          onChange={(e) => handleMemberChange(memberIndex, "name", e.target.value)}
                          error={!!errors.name}
                          helperText={
                            errors.name && (
                              <Typography variant="body2" sx={errorStyle}>
                                {errors.name}
                              </Typography>
                            )
                          }
                          variant="outlined"
                          fullWidth
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "#F9F1E6",
                              borderRadius: 1,
                            },
                            "& .MuiFormHelperText-root": {
                              backgroundColor: "transparent",
                            },
                            "& .MuiOutlinedInput-root.Mui-error": {
                              "& fieldset": {
                                borderColor: "#F28B82",
                              },
                            },
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography variant="subtitle1" gutterBottom sx={{ color: "white" }}>
                          Register Number
                        </Typography>
                        <TextField
                          placeholder="Enter register number (e.g., RA2111111111111)"
                          value={member.registerNumber}
                          onChange={(e) => handleRegisterNumberChange(memberIndex, e.target.value)}
                          error={!!errors.registerNumber}
                          helperText={
                            errors.registerNumber && (
                              <Typography variant="body2" sx={errorStyle}>
                                {errors.registerNumber}
                              </Typography>
                            )
                          }
                          variant="outlined"
                          fullWidth
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "#F9F1E6",
                              borderRadius: 1,
                            },
                            "& .MuiFormHelperText-root": {
                              backgroundColor: "transparent",
                            },
                            "& .MuiOutlinedInput-root.Mui-error": {
                              "& fieldset": {
                                borderColor: "#F28B82",
                              },
                            },
                          }}
                        />
                      </Box>

                      {/* Leader-specific fields */}
                      {isLeader && (
                        <>
                          <Box>
                            <Typography variant="subtitle1" gutterBottom sx={{ color: "white" }}>
                              Personal Email
                            </Typography>
                            <TextField
                              placeholder="Enter personal email"
                              value={member.personalEmail}
                              onChange={(e) => handleMemberChange(memberIndex, "personalEmail", e.target.value)}
                              error={!!errors.personalEmail}
                              helperText={
                                errors.personalEmail && (
                                  <Typography variant="body2" sx={errorStyle}>
                                    {errors.personalEmail}
                                  </Typography>
                                )
                              }
                              variant="outlined"
                              fullWidth
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: "#F9F1E6",
                                  borderRadius: 1,
                                },
                                "& .MuiFormHelperText-root": {
                                  backgroundColor: "transparent",
                                },
                                "& .MuiOutlinedInput-root.Mui-error": {
                                  "& fieldset": {
                                    borderColor: "#F28B82",
                                  },
                                },
                              }}
                            />
                          </Box>

                          <Box>
                            <Typography variant="subtitle1" gutterBottom sx={{ color: "white" }}>
                              Phone Number
                            </Typography>
                            <TextField
                              placeholder="Enter phone number"
                              value={member.phoneNumber}
                              onChange={(e) => handlePhoneNumberChange(e.target.value)}
                              error={!!errors.phoneNumber}
                              helperText={
                                errors.phoneNumber && (
                                  <Typography variant="body2" sx={errorStyle}>
                                    {errors.phoneNumber}
                                  </Typography>
                                )
                              }
                              variant="outlined"
                              fullWidth
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: "#F9F1E6",
                                  borderRadius: 1,
                                },
                                "& .MuiFormHelperText-root": {
                                  backgroundColor: "transparent",
                                },
                                "& .MuiOutlinedInput-root.Mui-error": {
                                  "& fieldset": {
                                    borderColor: "#F28B82",
                                  },
                                },
                              }}
                            />
                          </Box>
                        </>
                      )}

                      {/* Hostel Details - Optional for hostellers */}
                      <Box>
                        <Typography variant="subtitle1" gutterBottom sx={{ color: "white" }}>
                          If Hosteller, Enter Hostel Details
                        </Typography>
                        <TextField
                          placeholder="Hostel name & Room number (optional)"
                          value={member.hostelName || ""}
                          onChange={(e) => handleMemberChange(memberIndex, "hostelName", e.target.value)}
                          error={!!errors.hostelName}
                          helperText={
                            errors.hostelName && (
                              <Typography variant="body2" sx={errorStyle}>
                                {errors.hostelName}
                              </Typography>
                            )
                          }
                          variant="outlined"
                          fullWidth
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "#F9F1E6",
                              borderRadius: 1,
                            },
                            "& .MuiFormHelperText-root": {
                              backgroundColor: "transparent",
                            },
                            "& .MuiOutlinedInput-root.Mui-error": {
                              "& fieldset": {
                                borderColor: "#F28B82",
                              },
                            },
                          }}
                        />
                      </Box>
                    </>
                  );
                }
                return null;
              })()}

              {/* Payment Step */}
              {(() => {
                const numMembers = parseInt(formData.numberOfMembers) || 0;
                if (activeStep === 2 + numMembers) {
                  return (
                    <>
                      <Box>
                        <Typography variant="body1" sx={{ color: "rgba(249, 241, 230, 0.9)", mb: 3 }}>
                          Registration Fee: <strong>₹200 per team</strong>
                        </Typography>

                        {/* QR Code Placeholder */}
                        <Box
                          sx={{
                            width: "100%",
                            height: "300px",
                            backgroundColor: "rgba(249, 241, 230, 0.1)",
                            border: "2px dashed rgba(249, 241, 230, 0.3)",
                            borderRadius: 2,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            mb: 3,
                            backgroundImage: `url(${paymentQR})`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                          }}
                        />

                        <Typography variant="subtitle1" gutterBottom sx={{ color: "white", mt: 3 }}>
                          Upload Payment Proof
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(249, 241, 230, 0.7)", mb: 2 }}>
                          Please upload a screenshot of your payment confirmation
                        </Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          fullWidth
                          sx={{
                            borderColor: "#C77DFF",
                            color: "#F9F1E6",
                            padding: "12px",
                            mb: 1,
                            "&:hover": {
                              borderColor: "#B565E8",
                              backgroundColor: "rgba(199, 125, 255, 0.1)",
                            },
                          }}
                        >
                          Choose File
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </Button>
                        {formData.paymentProof && (
                          <Typography variant="body2" sx={{ color: "#C77DFF", mt: 1 }}>
                            Selected: {formData.paymentProof.name}
                          </Typography>
                        )}
                        {errors.paymentProof && (
                          <Typography variant="body2" sx={errorStyle}>
                            {errors.paymentProof}
                          </Typography>
                        )}
                      </Box>
                    </>
                  );
                }
                return null;
              })()}

              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mt: 1, flexShrink: 0 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mt: 1, color: "white", fontSize: { xs: "12px", md: "14px" }, py: { xs: 0.5, md: 1 } }}
                >
                  Back
                </Button>
                {activeStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    sx={{
                      mt: 1,
                      padding: "8px 16px",
                      fontSize: { xs: "12px", md: "14px" },
                      fontWeight: "bold",
                      backgroundColor: "#C77DFF",
                    }}
                    disabled={loading} // Disable the button while submitting
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    sx={{
                      mt: 1,
                      padding: "8px 16px",
                      fontSize: { xs: "12px", md: "14px" },
                      fontWeight: "bold",
                      backgroundColor: "#C77DFF",
                      minWidth: "120px",
                    }}
                  >
                    Continue
                  </Button>
                )}
              </Box>
            </Box>

            {/* Duplicate Registration Dialog */}
            <Dialog
              open={duplicateDialogOpen}
              onClose={() => setDuplicateDialogOpen(false)}
              PaperProps={{
                sx: {
                  backgroundColor: "#111",
                  borderRadius: 2,
                  padding: 2,
                },
              }}
            >
              <DialogTitle
                sx={{
                  fontFamily: "SF Pro Display, sans-serif",
                  fontSize: "24px",
                  fontWeight: 700,
                  lineHeight: "28px",
                  textAlign: "center",
                  color: "#F9F1E6",
                  paddingBottom: "8px",
                }}
              >
                Oops! You&apos;ve Already Registered
              </DialogTitle>
              <DialogContent>
                <DialogContentText
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: "16px",
                    fontWeight: 400,
                    lineHeight: "24px",
                    color: "rgba(249, 241, 230, 0.7)",
                    textAlign: "center",
                  }}
                >
                  It looks like you&apos;ve already claimed your spot with this registration number and SRM email.
                  <br />
                  We’re thrilled to have you onboard. Stay tuned for the event updates!
                </DialogContentText>
              </DialogContent>
              <DialogActions
                sx={{
                  justifyContent: "center", // Center align the button
                }}
              >
                <Button
                  onClick={() => setDuplicateDialogOpen(false)}
                  sx={{
                    backgroundColor: "#C77DFF",
                    color: "#F9F1E6",
                    "&:hover": {
                      backgroundColor: "#B565E8",
                    },
                    padding: "8px 24px",
                    fontWeight: "bold",
                  }}
                >
                  Got it!
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default Form;
