export class EjsHelpers {
    static formatCurrencyToID = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    }

    static formatDateToID = (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(date));
    }

    static capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    static capitalizeEachWord = (string) => {
        return string.split(' ').map(word => this.capitalizeFirstLetter(word)).join(' ');
    }
}