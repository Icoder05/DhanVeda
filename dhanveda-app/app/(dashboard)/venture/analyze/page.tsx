import VentureIQApp from '@/components/venture/VentureIQApp'

export const metadata = { title: 'New Business Investment — ArthaSift' }

export default function VentureAnalyzePage() {
  return (
    <div className="dv-main">
      <VentureIQApp initialView="analyzer" />
    </div>
  )
}
