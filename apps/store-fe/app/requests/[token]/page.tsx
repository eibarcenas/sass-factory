import { getRequest } from '@/lib/api'
import RequestDetail from './request-detail'

type Props = { params: Promise<{ token: string }> }

export default async function RequestPage({ params }: Props) {
  const { token } = await params
  const serverRequest = await getRequest(token)
  return <RequestDetail token={token} serverRequest={serverRequest} />
}
