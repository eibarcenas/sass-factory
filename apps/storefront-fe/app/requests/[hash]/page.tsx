import { getRequest } from '@/lib/api'
import RequestDetail from './request-detail'

type Props = { params: Promise<{ hash: string }> }

export default async function RequestPage({ params }: Props) {
  const { hash } = await params
  const serverRequest = await getRequest(hash)
  return <RequestDetail hash={hash} serverRequest={serverRequest} />
}
