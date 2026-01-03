import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/transaksi/4')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/transaksi/4"!</div>
}
