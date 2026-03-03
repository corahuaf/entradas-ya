// Formato de moneda (Soles Peruanos por defecto, ajusta según necesites)
export function formatPrice(amount: number) {
	return new Intl.NumberFormat('es-PE', {
		style: 'currency',
		currency: 'PEN'
	}).format(amount);
}

// Formato de fecha legible para humanos
export function formatDateTime(date: string | Date) {
	if (!date) return 'N/A';
	return new Intl.DateTimeFormat('es-PE', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(date));
}

// Función para generar un mensaje de éxito o error rápido
export const statusColors = {
	success: '#2ecc71',
	error: '#e74c3c',
	warning: '#f1c40f',
	info: '#3498db'
};
