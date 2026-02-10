import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

export const toast = {
	success: (msg: string) =>
		Toastify({
			text: msg,
			duration: 3000,
			gravity: 'top',
			position: 'right',
			style: {
				background:
					'linear-gradient(306deg,rgba(42, 123, 155, 1) 0%, rgba(87, 199, 133, 1) 50%)',
				color: 'text-white',
				borderRadius: '4px'
			}
		}).showToast(),

	error: (msg: string) =>
		Toastify({
			text: msg,
			duration: 4000,
			gravity: 'top',
			position: 'right',
			style: {
				background:
					'linear-gradient(261deg,rgba(253, 29, 29, 1) 50%, rgba(252, 176, 69, 1) 100%)',
				color: 'text-white',
				borderRadius: '4px'
			}
		}).showToast(),

	info: (msg: string) =>
		Toastify({
			text: msg,
			duration: 3000,
			gravity: 'top',
			position: 'right',
			style: {
				background:
					'linear-gradient(90deg,rgba(2, 0, 36, 1) 0%, rgba(9, 9, 121, 1) 35%, rgba(0, 212, 255, 1) 100%)',
				color: 'text-white',
				borderRadius: '4px'
			}
		}).showToast()
}
