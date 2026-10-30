import { redirect } from 'next/navigation'

export default function VentureCommunityRedirect() {
  redirect('/money/community?category=venture')
}
