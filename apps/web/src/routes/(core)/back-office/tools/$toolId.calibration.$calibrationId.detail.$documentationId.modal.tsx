import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(core)/back-office/tools/$toolId/calibration/$calibrationId/detail/$documentationId/modal',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello
      "/(core)/back-office/tools/$toolId/calibration/$calibrationId/detail/$documentationId/modal"!
    </div>
  )
}
