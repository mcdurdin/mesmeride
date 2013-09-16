# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20130916113448) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "authentications", force: true do |t|
    t.integer  "user_id"
    t.string   "provider"
    t.string   "uid"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "access_token"
  end

  create_table "routes", force: true do |t|
    t.string   "name"
    t.string   "source"
    t.string   "source_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "streams"
    t.integer  "user_id"
    t.integer  "zoom"
    t.integer  "x_scale"
    t.integer  "y_scale"
    t.string   "renderer"
    t.text     "renderer_options"
  end

  add_index "routes", ["user_id", "name"], name: "index_routes_on_user_id_and_name", using: :btree

  create_table "strava_activities", force: true do |t|
    t.integer  "activity_id"
    t.string   "name"
    t.datetime "start_date"
    t.text     "raw_data"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "users", force: true do |t|
    t.string   "name"
    t.string   "first_name"
    t.string   "last_name"
    t.string   "email"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "remember_token"
  end

  add_index "users", ["remember_token"], name: "index_users_on_remember_token", using: :btree

  create_table "waypoints", force: true do |t|
    t.string   "name"
    t.integer  "distance"
    t.integer  "elevation"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "route_id"
  end

  add_index "waypoints", ["route_id", "distance"], name: "index_waypoints_on_route_id_and_distance", using: :btree

end
