import {PrayerTimes, Coordinates, CalculationMethod, HighLatitudeRule} from "adhan";

export const getLondonPrayerTimesForToday = (): PrayerTimes => {
    const londonCoordinates = new Coordinates(51.5074, -0.1278);
    const date = new Date();

    const params = CalculationMethod.MuslimWorldLeague();
    params.fajrAngle = 15;
    params.ishaAngle = 15;
    params.highLatitudeRule = HighLatitudeRule.recommended(londonCoordinates);

    return new PrayerTimes(londonCoordinates, date, params);
};

// export const getLondonPrayerTimesForWeek = (): PrayerTimes[] => {
//     const weekPrayerTimes: PrayerTimes[] = [];
//     const currentDate = new Date();
//
//     for (let i = 0; i < 7; i++) {
//         weekPrayerTimes.push(getLondonPrayerTimesForToday());
//     }
//
//     return weekPrayerTimes;
// };
//
// export const getLondonPrayerTimesForMonth = (): PrayerTimes[] => {
//     const monthPrayerTimes: PrayerTimes[] = [];
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth();
//
//     while (currentDate.getMonth() === currentMonth) {
//         monthPrayerTimes.push(getLondonPrayerTimesForToday());
//         currentDate.setDate(currentDate.getDate() + 1);
//     }
//
//     return monthPrayerTimes;
// };