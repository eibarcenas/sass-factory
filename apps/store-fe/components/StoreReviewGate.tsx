import type { StoreData } from '@/lib/api'
import StoreView from './StoreView'

interface Props {
  slug: string
  data: StoreData
}

export default function StoreReviewGate({ data }: Props) {
  return <StoreView data={data} isReview />
}
