const gmod = (n: number, m: number) => {
    return ((n % m) + m) % m;
};

const kuwaitiCalendar = (adjust: number) => {
    let today = new Date();
    if (adjust) {
        const adjustMili = 1000 * 60 * 60 * 24 * adjust;
        const todayMili = today.getTime() + adjustMili;
        today = new Date(todayMili);
    }
    let day = today.getDate();
    let month = today.getMonth();
    let year = today.getFullYear();
    let m = month + 1;
    let y = year;
    if (m < 3) {
        y -= 1;
        m += 12;
    }

    // eslint-disable-next-line no-loss-of-precision
    let a = Math.floor(y / 100.);
    let b = 2 - a + Math.floor(a / 4.);
    if (y < 1583) b = 0;
    if (y == 1582) {
        if (m > 10)  b = -10;
        if (m == 10) {
            b = 0;
            if (day > 4) b = -10;
        }
    }

    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

    if (jd > 2299160) {
        a = Math.floor((jd - 1867216.25) / 36524.25);
        b = 1 + a - Math.floor(a / 4.);
    }
    const bb = jd + b + 1524;
    let cc = Math.floor((bb - 122.1) / 365.25);
    const dd = Math.floor(365.25 * cc);
    const ee = Math.floor((bb - dd) / 30.6001);
    day = (bb - dd) - Math.floor(30.6001 * ee);
    month = ee - 1;
    if (ee > 13) {
        cc += 1;
        month = ee - 13;
    }
    year = cc - 4716;

    let wd;
    if (adjust) {
        wd = gmod(jd + 1 - adjust, 7) + 1;
    } else {
        wd = gmod(jd + 1, 7) + 1;
    }

    // eslint-disable-next-line no-loss-of-precision
    const iyear = 10631. / 30.;
    const epochastro = 1948084;
    // eslint-disable-next-line no-loss-of-precision
    const shift1 = 8.01 / 60.;

    let z = jd - epochastro;
    const cyc = Math.floor(z / 10631.);
    z = z - 10631 * cyc;
    const j = Math.floor((z - shift1) / iyear);
    const iy = 30 * cyc + j;
    z = z - Math.floor(j * iyear + shift1);
    let im = Math.floor((z + 28.5001) / 29.5);
    if (im == 13) im = 12;
    const id = z - Math.floor(29.5001 * im - 29);

    return {
        day: day, // calculated day (CE)
        month: month - 1, // calculated month (CE)
        year: year, // calculated year (CE)
        jd: jd - 1, // julian day number
        wd: wd - 1, // weekday number
        id: id, // Islamic date
        im: im - 1, // Islamic month
        iy: iy // Islamic year
    };
};

export const getIslamicDate = (adjustment: number) => {
    // const wdNames = ["Ahad", "Ithnin", "Thulatha", "Arbaa", "Khams", "Jumuah", "Sabt"];
    const iMonthNames = [
        "Muharram", "Safar", "Rabi' Al-Awwal", "Rabi' Al-Akhir",
        "Jumada Al-Ula", "Jumada Al-Akhirah", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhul-Qa'dah", "Dhul-Hijjah"
    ];
    const iDate = kuwaitiCalendar(adjustment);
    return `${iDate.id} ${iMonthNames[iDate.im]} ${iDate.iy} H`;
};

