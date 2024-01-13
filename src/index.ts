import express, { Express, Request, Response } from 'express'

const app: Express = express()
const port: number = +process.env.PORT! || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const users: Record<string, any>[] = [
	{ id: 1, name: 'john doe', age: 28 },
	{ id: 2, name: 'jane doe', age: 27 }
]

app.get('/', (req: Request, res: Response) => {
	return res.status(200).json({ message: 'Ping' })
})

app.post('/user', (req: Request, res: Response) => {
	if (req.body.name == 'john doe' && req.body.age == 28) {
		return res.status(403).json({ message: 'Create new user failed' })
	}

	return res.status(201).json({ message: 'Create new user success' })
})

app.get('/user', (req: Request, res: Response) => {
	return res.status(200).json({
		message: 'Success',
		data: users
	})
})

app.get('/user/:id', (req: Request, res: Response) => {
	const user: Record<string, any> | undefined = users.find((val: Record<string, any>) => val.id == req.params.id)
	if (!user) {
		return res.status(404).json({ message: 'User not found' })
	}

	return res.status(200).json({ message: 'Success', data: user })
})

app.listen(port, () => console.info(`Server is running on port ${port}`))

export default app
