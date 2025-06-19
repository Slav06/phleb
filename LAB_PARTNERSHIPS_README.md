# Lab Partnerships System

## Overview

The platform now supports multiple lab partnerships beyond Quality Laboratory. This system allows admins to onboard new labs, manage their test types, and provide a flexible structure for expanding lab services.

## New Features

### 1. Lab Management
- **Add/Edit Labs**: Admins can create new lab partnerships with details like name, address, logo, and contact information
- **Lab Status**: Labs can be marked as active or inactive
- **Lab Branding**: Each lab can have its own logo and branding

### 2. Test Type Management
- **Test Types per Lab**: Each lab can have its own set of test types
- **Pricing**: Cash prices are managed per test type
- **Tube Colors**: Each test type specifies the required tube top color
- **Test Descriptions**: Detailed descriptions for each test type

### 3. Dynamic Form Integration
- **Lab Selection**: Blood draw forms now dynamically load available labs
- **Test Type Selection**: Once a lab is selected, available test types are loaded
- **Pricing Display**: Test prices are shown in the selection dropdown

## Database Schema

### New Tables

#### `labs` Table
```sql
CREATE TABLE public.labs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  address text,
  logo_url text,
  contact_email text,
  contact_phone text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### `test_types` Table
```sql
CREATE TABLE public.test_types (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  lab_id uuid REFERENCES public.labs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  cash_price numeric(10,2) NOT NULL,
  tube_top_color text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Updated Tables

#### `submissions` Table
- Added `lab_id` (references labs.id)
- Added `test_type_id` (references test_types.id)
- Removed `lab_brand` (replaced with lab_id)

## Admin Interface

### Lab Management Page (`/admin/labs`)
- **Labs Tab**: View all lab partnerships with their status and contact info
- **Test Types Tab**: View all test types across all labs
- **Add/Edit Labs**: Modal forms for creating and editing labs
- **Test Type Management**: View and manage test types for each lab

### Features
- **Lab CRUD Operations**: Create, read, update, delete labs
- **Test Type CRUD Operations**: Create, read, update, delete test types
- **Bulk Operations**: View all test types in one place
- **Status Management**: Activate/deactivate labs and test types

## User Interface Updates

### Blood Draw Form
- **Dynamic Lab Selection**: Dropdown populated with active labs
- **Dynamic Test Type Selection**: Dropdown populated with test types for selected lab
- **Price Display**: Shows test price and tube color in selection
- **Validation**: Test type selection is disabled until lab is selected

### Mobile Lab Dashboard
- **Lab Branding**: Shows lab logo and information
- **Test Type Integration**: Forms now use the new lab system

## Migration

### Database Migration
Run the migration script to update existing databases:
```sql
-- Run src/database/migrate_to_lab_partnerships.sql
```

### Data Migration
Quality Laboratory is automatically added as the first lab with common test types:
```sql
-- Run src/database/insert_quality_lab.sql
```

## Utility Functions

### `src/utils/labUtils.js`
Provides centralized functions for lab operations:

- `getLabs()` - Get all active labs
- `getTestTypes()` - Get all active test types
- `getTestTypesByLab(labId)` - Get test types for a specific lab
- `getLabById(labId)` - Get lab by ID
- `getTestTypeById(testTypeId)` - Get test type by ID
- `getLabOptions()` - Get lab options for forms
- `getTestTypeOptions(labId)` - Get test type options for forms
- `clearLabCache()` - Clear cached lab data

### Caching
Lab and test type data is cached for 5 minutes to improve performance and reduce database calls.

## API Integration

### Supabase Policies
- **Labs**: Anyone can view active labs, admins can manage all
- **Test Types**: Anyone can view active test types, admins can manage all
- **Submissions**: Users can only access their own submissions

### Row Level Security
All new tables have RLS enabled with appropriate policies for data security.

## Usage Examples

### Adding a New Lab
1. Go to Admin Panel → Lab Partnerships
2. Click "Add New Lab"
3. Fill in lab details (name, address, logo URL, contact info)
4. Save the lab
5. Click "View Test Types" to add test types for the lab

### Adding Test Types
1. Select a lab from the labs list
2. Click "View Test Types"
3. Click "Add Test Type"
4. Fill in test details (name, description, price, tube color)
5. Save the test type

### Using in Blood Draw Forms
1. Users select a lab from the dropdown
2. Test types for that lab are automatically loaded
3. Users select the specific test type
4. Price and tube color information is displayed

## Benefits

1. **Scalability**: Easy to add new lab partnerships
2. **Flexibility**: Each lab can have its own test types and pricing
3. **Maintainability**: Centralized lab and test type management
4. **User Experience**: Dynamic form loading based on lab selection
5. **Data Integrity**: Proper foreign key relationships and constraints

## Future Enhancements

1. **Lab-Specific Agreements**: Different agreement templates per lab
2. **Lab-Specific Pricing**: Different pricing models per lab
3. **Lab Analytics**: Performance metrics per lab
4. **Lab-Specific Forms**: Custom form fields per lab
5. **Multi-Lab Submissions**: Support for multiple labs in one submission

## Support

For questions or issues with the lab partnerships system, contact the development team or refer to the database migration scripts for troubleshooting. 