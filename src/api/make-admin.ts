import { setAdmin } from '../services/setAdmin'

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') return res.status(405).end()

	const { uid } = req.body
	if (!uid) return res.status(400).json({ error: 'No uid provided' })

	try {
		await setAdmin(uid)
		res.status(200).json({ message: 'User is now admin' })
	} catch (e) {
		res.status(500).json({ error: e })
	}
}
