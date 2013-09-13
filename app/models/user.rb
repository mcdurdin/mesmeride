class User < ActiveRecord::Base
  has_many :authentications, dependent: :destroy
  has_many :users, dependent: :destroy

  before_create :create_remember_token
  
  def User.new_remember_token
    SecureRandom.urlsafe_base64
  end
  
  def User.encrypt(token)
    Digest::SHA1.hexdigest(token.to_s)
  end

  def self.create_from_hash!(hash)
    create(:name => hash['info']['name'], :first_name => hash['info']['first_name'], :last_name => hash['info']['last_name'])
  end

  private

    def create_remember_token
      self.remember_token = User.encrypt(User.new_remember_token)
    end

end
