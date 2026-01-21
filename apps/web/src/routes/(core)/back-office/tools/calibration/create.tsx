import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(core)/back-office/tools/calibration/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(core)/back-office/tools/calibration/"!</div>
}
