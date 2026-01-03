import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/transaksi/3')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/transaksi/3"!</div>
}
