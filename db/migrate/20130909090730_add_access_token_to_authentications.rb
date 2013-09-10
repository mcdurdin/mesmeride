class AddAccessTokenToAuthentications < ActiveRecord::Migration
  def change
    add_column :authentications, :access_token, :string
  end
end
