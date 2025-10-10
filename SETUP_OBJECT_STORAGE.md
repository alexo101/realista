# Setting Up Replit App Storage for Property Images

## Step 1: Create a Storage Bucket

1. Open the **App Storage** tool:
   - Click on "All tools" button in the left sidebar
   - Select "App Storage" from the list
   
2. Create a new bucket:
   - Click "Create new bucket"
   - Name it: `realista-property-images`
   - Click "Create bucket"

3. Copy the Bucket ID:
   - In the App Storage tool, click "Settings" view
   - Copy the **Bucket ID** shown (it will look like: `replit-objstore-XXXXXXXXXXXX`)

## Step 2: Set Environment Variables

Once you have the Bucket ID, I need to set two environment variables:

1. `PUBLIC_OBJECT_SEARCH_PATHS` - Set this to: `/realista-property-images/public`
2. `PRIVATE_OBJECT_DIR` - Set this to: `/realista-property-images/private`

Replace `realista-property-images` with your actual bucket ID.

## Step 3: Upload Test Images (Optional)

You can manually upload test images to the bucket:
- Navigate to the "Objects" view in App Storage
- Create a folder called "property-images"
- Upload some test images

## What Happens Next

Once the environment variables are set, the image upload functionality will work:
- Property images will be uploaded directly to cloud storage
- Images will be served through our backend API
- The system is optimized for scalability and performance
