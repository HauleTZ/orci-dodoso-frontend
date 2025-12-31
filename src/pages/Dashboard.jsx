import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Container,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { MoreHoriz, PictureAsPdf, FileDownload, TrendingUp } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Keep colors
const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
const primaryRed = "#B22222";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responses, setResponses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    trained: 0,
    notTrained: 0,
    stale: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [deptData, setDeptData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/v1/responses/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          return;
        }

        if (res.status === 403) {
          setError("Huna ruhusa ya kuona ukurasa huu (Access Denied). Tafadhali wasiliana na ICT/HR.");
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch data");

        const data = await res.json();
        // Assuming DRF DefaultRouter returns direct list or paginated object
        const results = Array.isArray(data) ? data : data.results || [];
        setResponses(results);
        processData(results);
        setLoading(false);

      } catch (err) {
        console.error(err);
        setError("Kuna tatizo kwenye kupata taarifa.");
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const processData = (data) => {
    const total = data.length;
    const trained = data.filter(r => r.has_training === 'yes').length;
    const notTrained = data.filter(r => r.has_training === 'no').length;
    // Stale logic needs date diff, using placeholder logic for now or raw 'no' if complex
    const stale = 0; // Implement complex logic later

    setStats({
      total,
      trained,
      notTrained,
      stale
    });

    // Pie Chart
    setChartData([
      { name: 'Wenye Mafunzo', value: trained },
      { name: 'Wasio na Mafunzo', value: notTrained },
    ]);

    // Dept Bar Chart
    const deptCounts = {};
    data.forEach(r => {
      const dept = r.department || 'Unknown';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    const deptArray = Object.keys(deptCounts).map(k => ({ name: k, value: deptCounts[k] }));
    setDeptData(deptArray.slice(0, 7)); // Top 7
  };

  const generatePDF = () => {
    const doc = new jsPDF("p", "pt", "a4");

    // Title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const splitTitle = doc.splitTextToSize(
      "JEDWALI LA KUWASILISHA TAARIFA ZA WATUMISHI WA UMMA WALIOPATA MAFUNZO KWA KIPINDI CHA KUANZIA JULAI, 2008 HADI DESEMBA, 2025",
      500
    );
    doc.text(splitTitle, doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });

    // Real Data Aggregation
    const startYear = 2008;
    const endYear = 2025;
    const rows = [];
    let grandTotal = 0;

    // Helper to normalize sponsor
    const classifySponsor = (sponsor) => {
      if (!sponsor) return 'other';
      const s = sponsor.toLowerCase();
      if (s.includes('serikali') || s.includes('government')) return 'gov';
      if (s.includes('binafsi') || s.includes('private') || s.includes('self')) return 'private';
      return 'partner';
    };

    // Helper to normalize duration
    const classifyDuration = (type) => {
      if (!type) return 'short';
      const t = type.toLowerCase();
      if (t.includes('mrefu') || t.includes('long')) return 'long';
      return 'short';
    };

    // Flatten all training history from all responses
    const allTrainings = responses.flatMap(r => r.training_history || []);

    for (let year = startYear; year <= endYear; year++) {
      // Filter trainings for this year
      const yearTrainings = allTrainings.filter(t => {
        if (!t.start_date) return false;
        return new Date(t.start_date).getFullYear() === year;
      });

      let longTerm = 0;
      let shortTerm = 0;
      let gov = 0;
      let privateSponsor = 0;
      let partners = 0;

      yearTrainings.forEach(t => {
        // Duration
        if (classifyDuration(t.training_type) === 'long') longTerm++;
        else shortTerm++;

        // Sponsor
        const s = classifySponsor(t.sponsor);
        if (s === 'gov') gov++;
        else if (s === 'private') privateSponsor++;
        else partners++;
      });

      const yearTotal = longTerm + shortTerm;
      grandTotal += yearTotal;

      rows.push([
        year - startYear + 1, // NA
        year, // MWAKA
        longTerm, // MUDA MREFU
        shortTerm, // MUDA MFUPI
        gov, // SERIKALI
        privateSponsor, // BINAFSI
        partners, // WADAU
        yearTotal // JUMLA
      ]);
    }

    // Add Total Row
    rows.push(["", "JUMLA", "", "", "", "", "", grandTotal]);

    // Table
    autoTable(doc, {
      startY: 80,
      head: [
        [
          { content: "NA", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "MWAKA", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "AINA YA MAFUNZO YALIYOTOLEWA", colSpan: 2, styles: { halign: "center", fontStyle: "bold" } },
          { content: "UFADHILI", colSpan: 3, styles: { halign: "center", fontStyle: "bold" } },
          { content: "JUMLA KUU YA WATUMISHI WALIOPATA MAFUNZO", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
        ],
        [
          { content: "MAFUNZO YA MUDA MREFU", styles: { halign: "center" } },
          { content: "MAFUNZO YA MUDA MFUPI", styles: { halign: "center" } },
          { content: "SERIKALI", styles: { halign: "center" } },
          { content: "BINAFSI", styles: { halign: "center" } },
          { content: "WADAU WA MAENDELEO", styles: { halign: "center" } },
        ],
      ],
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 20,
        lineWidth: 0.1,
        lineColor: 10,
      },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" }, // NA
        1: { cellWidth: 50, halign: "center" }, // MWAKA
        // Others auto
        7: { halign: "center", fontStyle: "bold" } // Total
      },
    });

    // Footer Signature Section
    const finalY = doc.lastAutoTable.finalY + 40;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text("JINA LA ANAYETOA TAARIFA: ......................................................................", 40, finalY);
    doc.text("CHEO: .........................................................................................................", 40, finalY + 25);
    doc.text("TAREHE: .....................................................................................................", 40, finalY + 50);

    doc.save("Training_Report_2008_2025.pdf");
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f8f9fa", minHeight: "calc(100vh - 64px)" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Top Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={generatePDF}
            sx={{ bgcolor: primaryRed, "&:hover": { bgcolor: "#8B0000" } }}
          >
            Export PDF
          </Button>
          <Button variant="contained" startIcon={<FileDownload />} sx={{ bgcolor: primaryRed }}>
            Export Excel
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={4} justifyContent="center">
          {[
            { title: "Jumla ya Watumishi", value: stats.total, color: primaryRed },
            { title: "Waliopata Mafunzo", value: `${stats.trained} (${stats.total ? Math.round((stats.trained / stats.total) * 100) : 0}%)`, color: "#2E7D32" },
            { title: "Hawajawahi Kupata Mafunzo", value: stats.notTrained, color: primaryRed },
            { title: "Department Counts", value: deptData.length, color: "#ED6C02" },
          ].map((item, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{ borderTop: `4px solid ${item.color}`, borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="inherit">
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Middle Section: Charts */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={9}>
            <Grid container spacing={3}>
              {/* Donut Chart */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2, height: 400 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Hali ya Mafunzo
                  </Typography>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Bar Chart */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2, height: 400 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Watumishi kwa Idara
                  </Typography>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart
                      layout="vertical"
                      data={deptData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill={primaryRed} radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Table Section */}
        <Box mb={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Taarifa za Watumishi
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: primaryRed }}>
                  <TableCell sx={{ color: "white" }}>PF Number</TableCell>
                  <TableCell sx={{ color: "white" }}>Jina</TableCell>
                  <TableCell sx={{ color: "white" }}>Idara</TableCell>
                  <TableCell sx={{ color: "white" }}>Ana Mafunzo?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {responses.slice(0, 10).map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.pf_number}</TableCell>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.has_training}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </Box>
  );
}
