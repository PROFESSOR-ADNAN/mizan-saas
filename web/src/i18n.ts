import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'Mizan',
      tagline: 'Sales & Billing Analytics for Ethiopian Businesses',
      nav: {
        dashboard: 'Dashboard',
        dataSources: 'Data Sources',
        apiKeys: 'API Keys',
        billing: 'Billing & Plans',
        team: 'Team & Members',
        webhooks: 'Outbound Webhooks',
        imports: 'CSV Import',
        audit: 'Audit Log',
        admin: 'Platform Admin',
        settings: 'Settings',
        logout: 'Log Out',
      },
      dashboard: {
        title: 'Sales & Performance Dashboard',
        asOf: 'Data as of',
        rollupLag: 'Rollup Lag: Optimal (<5s)',
        filters: {
          presetAll: 'Last 30 Days',
          presetFiscal: 'Ethiopian Fiscal Year (Hamle 1)',
          allSources: 'All Sources',
          allChannels: 'All Channels',
          allBranches: 'All Branches',
        },
        metrics: {
          revenue: 'Total Revenue',
          orders: 'Total Orders',
          units: 'Units Sold',
          expenses: 'Total Expenses',
          profit: 'Gross Profit',
        },
        charts: {
          revenueTrend: 'Daily Revenue Trend (ETB)',
          channelMix: 'Channel Mix Breakdown',
          topProducts: 'Top Selling Products (SKU Ranking)',
        },
      },
      billing: {
        title: 'Subscription & Usage Metering',
        currentPlan: 'Current Plan',
        usageOverview: 'Event Ingestion Quota',
        invoices: 'Billing Invoices',
        payWithChapa: 'Pay with Chapa (Telebirr / Cards)',
        invoiceNumber: 'Invoice #',
        period: 'Period',
        amount: 'Total Amount',
        status: 'Status',
        action: 'Action',
        pdfDownload: 'Download PDF',
      },
      common: {
        save: 'Save',
        cancel: 'Cancel',
        create: 'Create',
        delete: 'Delete',
        edit: 'Edit',
        loading: 'Loading...',
        status: 'Status',
        language: 'Language',
      },
    },
  },
  am: {
    translation: {
      appName: 'ሚዛን',
      tagline: 'የሽያጭ እና የክፍያ ትንታኔ ስርዓት ለኢትዮጵያ ንግዶች',
      nav: {
        dashboard: 'ዳሽቦርድ',
        dataSources: 'የመረጃ ምንጮች',
        apiKeys: 'የኤፒአይ ቁልፎች',
        billing: 'ክፍያ እና ፕላኖች',
        team: 'ቡድን እና አባላት',
        webhooks: 'የድር ማሳወቂያዎች',
        imports: 'ሲኤስቪ አስመጣ',
        audit: 'የኦዲት መዝገብ',
        admin: 'የስርዓት አስተዳዳሪ',
        settings: 'ቅንብሮች',
        logout: 'ውጣ',
      },
      dashboard: {
        title: 'የሽያጭ እና አፈጻጸም ዳሽቦርድ',
        asOf: 'መረጃው የወጣው',
        rollupLag: 'የማጠናቀር መዘግየት: ፈጣን (<5 ሰከንድ)',
        filters: {
          presetAll: 'ያለፉት 30 ቀናት',
          presetFiscal: 'የኢትዮጵያ የበጀት ዓመት (ከሐምሌ 1)',
          allSources: 'ሁሉም ምንጮች',
          allChannels: 'ሁሉም መስመሮች',
          allBranches: 'ሁሉም ቅርንጫፎች',
        },
        metrics: {
          revenue: 'ጠቅላላ ገቢ',
          orders: 'የታዘዙት ብዛት',
          units: 'የተሸጡ እቃዎች',
          expenses: 'ጠቅላላ ወጪ',
          profit: 'የተጣራ ትርፍ',
        },
        charts: {
          revenueTrend: 'የዕለታዊ ገቢ ሂደት (ብር)',
          channelMix: 'የሽያጭ መስመር ድርሻ',
          topProducts: 'ከፍተኛ ተፈላጊ እቃዎች',
        },
      },
      billing: {
        title: 'የደንበኝነት ምዝገባ እና አጠቃቀም',
        currentPlan: 'የአሁን ፕላን',
        usageOverview: 'የክስተቶች አጠቃቀም መጠን',
        invoices: 'የክፍያ ደረሰኞች',
        payWithChapa: 'በቻፓ ይክፈሉ (ቴሌብር / ካርዶች)',
        invoiceNumber: 'የደረሰኝ ቁጥር',
        period: 'ጊዜ',
        amount: 'ጠቅላላ ሂሳብ',
        status: 'ሁኔታ',
        action: 'ድርጊት',
        pdfDownload: 'ፒዲኤፍ አውርድ',
      },
      common: {
        save: 'አስቀምጥ',
        cancel: 'ሰርዝ',
        create: 'አዲስ ፍጠር',
        delete: 'አጥፋ',
        edit: 'አስተካክል',
        loading: 'በመጫን ላይ...',
        status: 'ሁኔታ',
        language: 'ቋንቋ',
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
