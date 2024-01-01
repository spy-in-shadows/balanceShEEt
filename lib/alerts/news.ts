import { Alert } from './inventory'

const MOCK_NEWS_ITEMS = [
  {
    title: 'Market Trends: E-commerce Growth Continues',
    message: 'Online retail sales projected to grow 15% this quarter. Consider expanding digital channels.',
  },
  {
    title: 'Supply Chain Alert',
    message: 'Potential delays in shipping from major suppliers. Review inventory levels for critical items.',
  },
  {
    title: 'Seasonal Demand Forecast',
    message: 'Holiday shopping season approaching. Historical data shows 40% increase in electronics sales.',
  },
  {
    title: 'Competitor Analysis',
    message: 'Major competitor launched promotional campaign. Monitor pricing strategies and customer feedback.',
  },
  {
    title: 'Consumer Behavior Shift',
    message: 'Mobile shopping now accounts for 60% of online purchases. Optimize mobile experience.',
  },
]

export async function getNewsAlerts(): Promise<Alert[]> {
  // Mock implementation - randomly select 1-2 news items
  const now = new Date()
  const numAlerts = Math.floor(Math.random() * 2) + 1
  const selectedNews = [...MOCK_NEWS_ITEMS]
    .sort(() => Math.random() - 0.5)
    .slice(0, numAlerts)

  return selectedNews.map((news, idx) => ({
    id: `news-${Date.now()}-${idx}`,
    type: 'news' as const,
    title: news.title,
    message: news.message,
    timestamp: now,
  }))
}
