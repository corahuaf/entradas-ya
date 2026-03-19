// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: {
				id: number;
				nombre: string;
				email: string;
				rol: 'ADMIN' | 'CAJERO' | 'CONTROL_ENTRADAS';
				estado: string;
			};
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
