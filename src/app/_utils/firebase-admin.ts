import admin from "firebase-admin";

function initializeFirebaseAdmin() {
    if (!admin.apps.length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccount) {
            throw new Error("Missing Firebase credentials");
        }

        let serviceAccountObj;
        try {
            serviceAccountObj = JSON.parse(serviceAccount);

            // Validate required fields
            if (!serviceAccountObj.client_email) {
                console.error("Service account missing client_email, attempting to fix");
                // Debug what we received
                console.log("Service account keys:", Object.keys(serviceAccountObj));

                if (serviceAccountObj.type && serviceAccountObj.project_id && serviceAccountObj.private_key) {
                    // Use the service account we have from your JSON file
                    serviceAccountObj.client_email = `firebase-adminsdk-a6w76@${serviceAccountObj.project_id}.iam.gserviceaccount.com`;
                }
            }

        } catch (parseError) {
            console.error("Error parsing service account:", parseError);
            throw new Error("Invalid service account format");
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountObj),
        });
    }
    return admin;
}

const firebaseAdmin = initializeFirebaseAdmin();
export default firebaseAdmin;
