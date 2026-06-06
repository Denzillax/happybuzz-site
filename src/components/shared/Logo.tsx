import Link from 'next/link'

export function Logo({ width = 400, white = false }: { width?: number, white?: boolean }) {
  return (
    <Link href="/" className="flex items-center shrink-0">
      <img
        src="/logo.svg"
        alt="BEEDARO"
        style={{
          width,
          height: 'auto',
          ...(white ? { filter: 'brightness(0) invert(1)' } : {}),
        }}
      />
    </Link>
  )
}
