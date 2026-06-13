import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { BrutalCard } from '../../components/BrutalCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import apiClient from '../../api/client';

const screenWidth = Dimensions.get('window').width - 48; // padding 24 each side

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<{ expenses: any[], caseStatus: any[] }>({ expenses: [], caseStatus: [] });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await apiClient.get('/dashboard/reports');
      setReports(res.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  const getExpensesData = () => {
    const labels: string[] = [];
    const data: number[] = [];

    if (reports.expenses.length === 0) {
      return { labels: ["Yok"], datasets: [{ data: [0] }] };
    }

    reports.expenses.forEach(e => {
      const m = parseInt(e.month, 10);
      labels.push(monthNames[m - 1] || e.month);
      data.push(e.total || 0);
    });

    return {
      labels,
      datasets: [{ data }]
    };
  };

  const getPieData = () => {
    if (reports.caseStatus.length === 0) {
      return [{ name: "Veri Yok", count: 1, color: colors.surfaceVariant, legendFontColor: colors.text.secondary, legendFontSize: 12 }];
    }

    const colorMap: Record<string, string> = {
      'active': colors.accent.green,
      'closed': colors.accent.red,
      'pending': colors.accent.yellow,
    };

    const statusMap: Record<string, string> = {
      'active': 'Açık Davalar',
      'closed': 'Kapanan',
      'pending': 'Beklemede'
    };

    return reports.caseStatus.map(c => ({
      name: statusMap[c.status] || c.status,
      count: c.count,
      color: colorMap[c.status] || colors.primary,
      legendFontColor: colors.text.primary,
      legendFontSize: 12,
    }));
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.text.primary} />
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    propsForBackgroundLines: {
      strokeWidth: 0, // Arka plan çizgilerini kaldırdım (Daha temiz brutalist görünüm)
    },
    propsForLabels: {
      fontFamily: typography.fonts.label,
      fontSize: 10,
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>GELİŞMİŞ RAPORLAR</Text>

      <BrutalCard style={styles.card}>
        <Text style={styles.cardTitle}>Son 6 Ay Masraf Analizi</Text>
        <View style={styles.chartWrapper}>
          <BarChart
            data={getExpensesData()}
            width={screenWidth - 32} // padding inside card
            height={220}
            yAxisLabel="₺ "
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            style={styles.chartStyle}
            showValuesOnTopOfBars={false} // İç içe geçmeyi önlemek için kaldırıldı
            fromZero={true}
          />
        </View>
      </BrutalCard>

      <BrutalCard style={styles.card}>
        <Text style={styles.cardTitle}>Dava Durum Dağılımı</Text>
        <View style={styles.chartWrapper}>
          <PieChart
            data={getPieData()}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            accessor={"count"}
            backgroundColor={"transparent"}
            paddingLeft={"16"} // Etiketlerle grafik arasına boşluk
            center={[10, 0]} // Grafiği biraz sağa kaydırıp ortaladık
            absolute
          />
        </View>
      </BrutalCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 100,
  },
  headerTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
    padding: 16,
  },
  cardTitle: {
    fontFamily: typography.fonts.headline,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: 16,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 0,
    paddingRight: 32, // Grafiğin sağından taşmasını önlemek için
  }
});
