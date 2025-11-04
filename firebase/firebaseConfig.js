import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

export const getAuth = () => auth();
export const getDb = () => firestore();
