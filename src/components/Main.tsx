const MainComponent = ({ children }: { children: React.ReactNode }) => {
	return (
		<main
			className='relative flex items-center justify-center select-none w-full min-h-dvh touch-action-none overflow-hidden'
			style={{ overscrollBehavior: 'none' }}
		>
			{children}
		</main>
	)
}
export default MainComponent
