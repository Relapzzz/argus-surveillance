export interface GuideTask { title: string; blurb: string; to: string | null }

export function guideTasks(): GuideTask[] {
  return [
    { title: 'See who connects the groups', blurb: 'The person every route between the groups runs through, and why.', to: '/network' },
    { title: "Trace a complainant's phone to a leader", blurb: 'Follow the calls from a complaint up to the top of a group.', to: '/network?tab=route' },
    { title: 'Follow the money', blurb: 'Transfers split into small amounts to stay under the reporting limit.', to: '/alerts?type=structuring' },
    { title: 'See when they talked', blurb: 'Calls, transfers and incidents on one timeline.', to: '/timeline' },
    { title: 'See where it happened', blurb: 'FIR places, homes and call activity on a map of Pune.', to: '/map' },
    { title: 'Read an FIR', blurb: 'The original complaint with every extracted entity marked.', to: '/cases' },
    { title: 'Add a new FIR', blurb: 'Upload a complaint and watch the picture change.', to: '/ingest' },
  ]
}
