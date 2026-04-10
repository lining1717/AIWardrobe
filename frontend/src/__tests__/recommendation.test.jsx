import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../i18n'
import { RecommendationProvider } from '../contexts/RecommendationContext'
import Recommendation from '../pages/Recommendation'

vi.mock('react-markdown', () => ({
  default: ({ children }) => children,
}))

describe('Recommendation mode and reasons', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    const fetchMock = vi.fn(async (url) => {
      const requestUrl = String(url)

      if (requestUrl.endsWith('/config')) {
        return {
          ok: true,
          json: async () => ({ weather_location: '上海, 上海市, 中国' }),
        }
      }

      if (requestUrl.includes('/recommendation?')) {
        const query = requestUrl.split('?')[1] || ''
        const params = new URLSearchParams(query)
        const mode = params.get('mode') || 'balanced'
        return {
          ok: true,
          json: async () => ({
            weather: {
              temperature: 22,
              feelsLike: 23,
              condition: '晴',
              icon: '100',
              humidity: 50,
              windDir: '东北风',
              windScale: '3',
              location: '上海, 上海市, 中国',
              obsTime: '2026-04-10T10:00:00+08:00',
            },
            recommendation_text: '测试推荐文案',
            outfit_summary: '测试总结',
            selection_reasons: {
              top: '',
              bottom: '下装理由',
              shoes: '鞋履理由',
            },
            suggested_top: { item: '白衬衫', image_url: null },
            suggested_bottom: { item: '黑长裤', image_url: null },
            suggested_shoes: { item: '小白鞋', image_url: null },
            suggested_accessories: [],
            purchase_suggestions: [],
            goal_raw: '通勤',
            goal_normalized: 'commute',
            mode,
          }),
        }
      }

      return { ok: false, json: async () => ({}) }
    })

    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends selected mode and shows reason fallback', async () => {
    i18n.changeLanguage('en')
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <RecommendationProvider>
          <Recommendation />
        </RecommendationProvider>
      </MemoryRouter>,
    )

    const goalInput = await screen.findByPlaceholderText('e.g. commute / date / sport / interview')
    await user.type(goalInput, 'commute')

    await user.click(screen.getByRole('button', { name: 'Goal first' }))
    await user.click(screen.getByRole('button', { name: "Generate Today's Recommendation" }))

    await waitFor(() => {
      const calls = fetch.mock.calls.map(([url]) => String(url))
      const recommendationCall = calls.find((u) => u.includes('/recommendation?'))
      expect(recommendationCall).toContain('mode=goal_first')
      expect(recommendationCall).toContain('goal=commute')
    })

    const fallback = await screen.findByText('Matches current temperature and style strategy')
    expect(fallback).toBeTruthy()
  })
})
