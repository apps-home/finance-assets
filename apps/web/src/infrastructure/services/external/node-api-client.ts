import { env } from '@finance-assets-web/env/web'
import axios from 'axios'

export const nodeApiClient = axios.create({
	baseURL: env.NODE_API_URL
})
