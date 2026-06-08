export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      evaluations: {
        Row: {
          id: string
          user_id: string
          property_name: string
          property_address: string
          property_type: PropertyType
          size_sqft: number
          lease_left: number
          purchase_price: number
          market_valuation: number
          bank_valuation: number
          absd: boolean
          gst_registered: boolean
          lb_profile: LbProfile
          loan_interest_rate: number
          loan_tenure_years: number
          downpayment_percent: number
          corp_sect_fee: number
          legal_conveyance_fee: number
          selling_legal_conveyance_fee: number
          legal_jv_fee: number
          bank_facilities_fee: number
          insurance: number
          rental_agents_commission: number
          backup_funds_months: number
          rental_current: number
          rental_expected: number
          property_tax_monthly: number
          mcst_monthly: number
          lot_size: number
          ci_percent: number
          dm_percent: number
          lb_percent: number
          plan_exit_year: number
          conservative_growth: number
          baseline_growth: number
          target_growth: number
          aggressive_growth: number
          status: EvaluationStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_name: string
          property_address?: string
          property_type?: PropertyType
          size_sqft: number
          lease_left: number
          purchase_price: number
          market_valuation?: number
          bank_valuation?: number
          absd?: boolean
          gst_registered?: boolean
          lb_profile?: LbProfile
          loan_interest_rate?: number
          loan_tenure_years?: number
          downpayment_percent?: number
          corp_sect_fee?: number
          legal_conveyance_fee?: number
          selling_legal_conveyance_fee?: number
          legal_jv_fee?: number
          bank_facilities_fee?: number
          insurance?: number
          rental_agents_commission?: number
          backup_funds_months?: number
          rental_current: number
          rental_expected?: number
          property_tax_monthly: number
          mcst_monthly: number
          lot_size?: number
          ci_percent?: number
          dm_percent?: number
          lb_percent?: number
          plan_exit_year?: number
          conservative_growth?: number
          baseline_growth?: number
          target_growth?: number
          aggressive_growth?: number
          status?: EvaluationStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_name?: string
          property_address?: string
          property_type?: PropertyType
          size_sqft?: number
          lease_left?: number
          purchase_price?: number
          market_valuation?: number
          bank_valuation?: number
          absd?: boolean
          gst_registered?: boolean
          lb_profile?: LbProfile
          loan_interest_rate?: number
          loan_tenure_years?: number
          downpayment_percent?: number
          corp_sect_fee?: number
          legal_conveyance_fee?: number
          selling_legal_conveyance_fee?: number
          legal_jv_fee?: number
          bank_facilities_fee?: number
          insurance?: number
          rental_agents_commission?: number
          backup_funds_months?: number
          rental_current?: number
          rental_expected?: number
          property_tax_monthly?: number
          mcst_monthly?: number
          lot_size?: number
          ci_percent?: number
          dm_percent?: number
          lb_percent?: number
          plan_exit_year?: number
          conservative_growth?: number
          baseline_growth?: number
          target_growth?: number
          aggressive_growth?: number
          status?: EvaluationStatus
          created_at?: string
          updated_at?: string
        }
      }
      tax_formulas: {
        Row: {
          id: string
          formula_type: string
          formula_name: string
          formula_config: Json
          description: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          formula_type: string
          formula_name: string
          formula_config: Json
          description?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          formula_type?: string
          formula_name?: string
          formula_config?: Json
          description?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
    }
    Enums: {
      property_type_enum: 'Residential' | 'Industrial' | 'Commercial'
      lb_profile_enum: 'Individual' | 'IHC' | 'Operating'
      evaluation_status_enum: 'Draft' | 'Complete'
    }
  }
}

export type PropertyType = Database['public']['Enums']['property_type_enum']
export type LbProfile = Database['public']['Enums']['lb_profile_enum']
export type EvaluationStatus = Database['public']['Enums']['evaluation_status_enum']

export type Evaluation = Database['public']['Tables']['evaluations']['Row']
export type EvaluationInsert = Database['public']['Tables']['evaluations']['Insert']
export type EvaluationUpdate = Database['public']['Tables']['evaluations']['Update']

export type TaxFormula = Database['public']['Tables']['tax_formulas']['Row']
