class Route < ActiveRecord::Base
  has_many :waypoints, dependent: :destroy
  
  def self.import_from_activity(activity_id)
    activity = StravaActivity.find_by_activity_id(activity_id)
    
    @route = Route.create(:name => activity.name, :source => "StravaActivity", :source_id => activity_id)

    # Count segments that qualify
    
    # return activity.data["segment_efforts"].inspect

    segment_count = activity.data["segment_efforts"].find_all { |e| e["segment"]["climb_category"] != 0 }.size

    # Create segments
    
    i = 0
    
    activity.data["segment_efforts"].each do |e|
      @route.waypoints.create(:name => e["name"], :distance => activity.data["distance"] * i/segment_count, :elevation => 0) \
        unless e["segment"]["climb_category"] == 0
      i = i + 1
    end
    
    @route
  end
end
