/**
 * Organization Schema (JSON-LD)
 *
 * 用於搜尋引擎識別品牌/公司資訊
 * 可能觸發 Google Knowledge Panel
 *
 * @see https://schema.org/Organization
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '豪德製茶所',
    alternateName: 'Haude Tea',
    url: 'https://haude-tea.com',
    logo: 'https://haude-tea.com/logo.png',
    description:
      '傳承三代的製茶工藝，堅持手工採摘、精心烘焙，為您呈現台灣高山茶的純粹風味。',
    foundingDate: '1980',
    founder: {
      '@type': 'Person',
      name: '豪德製茶所創辦人',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TW',
      addressRegion: '嘉義縣',
      addressLocality: '阿里山鄉',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Chinese', 'English'],
    },
    sameAs: [
      // 社群媒體連結（待填入實際連結）
      // 'https://www.facebook.com/haudetea',
      // 'https://www.instagram.com/haudetea',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
