import {useEffect, useState} from "react";
import {getIslamicDate} from "@/utils/getIslamicDate.ts";
import {getLondonPrayerTimesForToday} from "@/utils/prayerTimes.ts";


const PrayerTimes = () => {
    const [prayerTimes, setPrayerTimes] = useState(getLondonPrayerTimesForToday());
    const [islamicDate, setIslamicDate] = useState(getIslamicDate(1));
    useEffect(() => {
        const timer = setInterval(() => {
            setPrayerTimes(getLondonPrayerTimesForToday());
            setIslamicDate(getIslamicDate(1));
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-white shadow-md rounded-lg">
            <div className="text-gray-500">
                <div>{new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
                <div>{islamicDate}</div>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-4 md:mt-0">
                <div className="text-center">
                    <div className="font-semibold">Fajr</div>
                    <div>{prayerTimes.fajr.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold">Zuhr</div>
                    <div>{prayerTimes.dhuhr.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold">'Asr</div>
                    <div>{prayerTimes.asr.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold">Maghrib</div>
                    <div>{prayerTimes.maghrib.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold">Isha</div>
                    <div>{prayerTimes.isha.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
            </div>
        </div>
    );
};

export default PrayerTimes;
