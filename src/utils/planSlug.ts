const PLAN_SLUG_ALIASES: Record<string, string> = {
  'plano-mensal-padrao': 'plano-mensal',
  'plano-vitalicio': 'plano-anual'
}

const getReverseAliases = (): Record<string, string[]> => {
  const reverse: Record<string, string[]> = {}

  Object.entries(PLAN_SLUG_ALIASES).forEach(([legacySlug, currentSlug]) => {
    if (!reverse[currentSlug]) {
      reverse[currentSlug] = []
    }

    reverse[currentSlug].push(legacySlug)
  })

  return reverse
}

const REVERSE_ALIASES = getReverseAliases()

export const normalizePlanSlug = (slug?: string | null): string => {
  const normalizedInput = String(slug || '').trim().toLowerCase()
  if (!normalizedInput) return ''
  return PLAN_SLUG_ALIASES[normalizedInput] || normalizedInput
}

export const resolvePlanSlug = (
  currentSlug: string | null | undefined,
  availableSlugs: string[]
): string => {
  const normalizedCurrent = normalizePlanSlug(currentSlug)
  const rawCurrent = String(currentSlug || '').trim().toLowerCase()

  const availableByLower = new Map<string, string>()
  availableSlugs.forEach((slug) => {
    const key = String(slug || '').trim().toLowerCase()
    if (key) {
      availableByLower.set(key, slug)
    }
  })

  const candidates = [
    normalizedCurrent,
    rawCurrent,
    ...(REVERSE_ALIASES[normalizedCurrent] || []),
    ...(REVERSE_ALIASES[rawCurrent] || [])
  ].filter(Boolean)

  for (const candidate of candidates) {
    const match = availableByLower.get(candidate)
    if (match) {
      return match
    }
  }

  return String(currentSlug || '').trim()
}
