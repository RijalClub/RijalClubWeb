import HomePage from "./pages/HomePage";
import {useEffect} from "react";
import {getLondonPrayerTimesForToday} from "@/utils/prayerTimes.ts";
import {getIslamicDate} from "@/utils/getIslamicDate.ts";

const App = () => {
    useEffect(() => {
        console.log(getLondonPrayerTimesForToday());
        console.log(getIslamicDate(1));
    }, []);

    return (
    <div>
      <HomePage />
    </div>
  );
};

export default App;