import 'mocha'
import { request, use, expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../src'

use(chaiHttp)

describe('Setup Test', function () {
	it('Should be request - Ping success', async function () {
		const res = await request(app).get('/').set('Content-Type', 'application/json')

		expect(res.status).is.deep.equal(200)
		expect(res.body.message).is.deep.equal('Ping')
	})

	it('Should be request - Create new user success', async function () {
		const res = await request(app).post('/user').send({ name: 'jamal cavalera', age: 25 }).set('Content-Type', 'application/json')

		expect(res.status).is.deep.equal(201)
		expect(res.body.message).to.be.deep.equal('Create new user success')
	})

	it('Should be request - Create new user failed', async function () {
		const res = await request(app).post('/user').send({ name: 'john doe', age: 28 }).set('Content-Type', 'application/json')

		expect(res.status).is.deep.equal(403)
		expect(res.body.message).to.be.deep.equal('Create new user failed')
	})

	it('Should be request - Get all user success', async function () {
		const res = await request(app).get('/user').set('Content-Type', 'application/json')

		expect(res.status).is.deep.equal(200)
		expect(res.body.message).to.be.deep.equal('Success')
	})

	it('Should be request - Get user by id success', async function () {
		const res = await request(app).get(`/user/1`).set('Content-Type', 'application/json')

		expect(res.status).is.deep.equal(200)
		expect(res.body.message).to.be.deep.equal('Success')
	})

	it('Should be request - Get user by id failed', async function () {
		const res = await request(app).get(`/user/3`).set('Content-Type', 'application/json')

		expect(res.status).is.deep.equal(404)
		expect(res.body.message).to.be.deep.equal('User not found')
	})
})
