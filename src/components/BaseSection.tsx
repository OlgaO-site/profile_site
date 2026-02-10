const BaseSection = ({
	className,
	children
}: {
	className?: string
	children?: React.ReactNode
}) => {
	return (
		<section className={`${className} w-full px-4 xl:px-24.5 2xl:px-40 mx-auto`}>
			{children}
		</section>
	)
}
export default BaseSection
