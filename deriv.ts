
import DerivAPI from '@deriv/deriv-api';
const APP_ID=1089;
 const API_TOKEN="33s8wGhNKehL4qg8sWzxY";
const connection = new WebSocket(`wss://://derivws.com{APP_ID}`);

export const api = new DerivAPI({ connection });
